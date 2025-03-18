import base64
import io
import os
import datetime

import dash
from dash import dcc, html, Input, Output, State
from dash.dependencies import ALL
import flask
from flask import send_file, make_response
import pandas as pd

# Import the Parser from apple_health_parser
# pip install apple-health-parser
from apple_health_parser.utils.parser import Parser

# -------------------------------------------------------------------
# Flask and Dash Setup
# -------------------------------------------------------------------
server = flask.Flask(__name__)
server.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024  # 512 MB

app = dash.Dash(__name__, server=server)
app.title = "Apple Health Parser (Group by Day)"

# Global store: { flag: DataFrame } (raw data from parser)
data_by_flag = {}

# -------------------------------------------------------------------
# Layout
# -------------------------------------------------------------------
app.layout = html.Div([
    html.Div(style={"maxWidth": "900px", "margin": "auto", "backgroundColor": "#fff", "padding": "20px", "borderRadius": "8px"}, children=[
        html.H1("Apple Health Parser – Group by Day"),
        html.P("Upload your apple_health_export.zip. For each flag, we group rows by the day (using 'start_date') and take the maximum 'value' for each day. "
               "Then, the first day is timestamp 0 and subsequent days are the day offset. The final CSV contains only [timestamp, metric]."),

        dcc.Upload(
            id="upload-zip",
            children=html.Div(["Drag & Drop or ", html.A("Select export.zip")]),
            style={
                "width": "100%", "height": "80px", "lineHeight": "80px",
                "borderWidth": "2px", "borderStyle": "dashed",
                "borderRadius": "5px", "textAlign": "center",
                "margin": "10px 0",
            },
            multiple=False
        ),

        html.Div(id="upload-status", style={"color": "red", "marginBottom": "15px"}),
        html.Div(id="flags-container", className="card-container")
    ])
])

# -------------------------------------------------------------------
# Callback: Parse ZIP and build cards for each flag with a dual slider
# -------------------------------------------------------------------
@app.callback(
    [Output("upload-status", "children"),
     Output("flags-container", "children")],
    [Input("upload-zip", "contents")],
    [State("upload-zip", "filename")],
    prevent_initial_call=True
)
def parse_zip(contents, filename):
    if not contents:
        return ("No file uploaded.", [])
    if not filename.lower().endswith(".zip"):
        return ("Please upload a .zip Apple Health export.", [])

    try:
        _, b64data = contents.split(",")
        decoded = base64.b64decode(b64data)
    except Exception as e:
        return (f"Error decoding file: {e}", [])

    temp_zip = "temp_export.zip"
    with open(temp_zip, "wb") as f:
        f.write(decoded)

    global data_by_flag
    data_by_flag.clear()

    # Parse the export using apple_health_parser
    try:
        parser = Parser(export_file=temp_zip, overwrite=True)
    except Exception as e:
        return (f"Error initializing apple_health_parser: {e}", [])
    if os.path.exists(temp_zip):
        os.remove(temp_zip)

    flags = parser.flags
    if not flags:
        return ("No flags found in this export.", [])

    cards = []
    for flg in flags:
        try:
            data_obj = parser.get_flag_records(flag=flg)
            df = data_obj.records
            if isinstance(df, pd.DataFrame):
                data_by_flag[flg] = df
            else:
                data_by_flag[flg] = pd.DataFrame(data_obj.records)
        except Exception as e:
            print(f"Warning: could not parse flag {flg}: {e}")
            continue

        df = data_by_flag.get(flg)
        # For grouping by day, we need to convert 'start_date' to datetime and get unique days.
        if df is not None and not df.empty and "start_date" in df.columns:
            df["start_date"] = pd.to_datetime(df["start_date"], errors="coerce")
            # Group by the date part and take max of 'value'
            grouped = df.groupby(df["start_date"].dt.date).agg({"value": "max"}).reset_index()
            row_count = len(grouped)
            preview_html = grouped.head(5).to_html(index=False)
        else:
            row_count = 0
            preview_html = "<em>Empty DataFrame</em>"

        card = html.Div([
            html.H3(flg),
            html.P(f"Unique Days: {row_count}"),
            html.Div(dcc.Markdown(preview_html, dangerously_allow_html=True), className="preview-table"),
            html.P("Select day range:"),
            dcc.RangeSlider(
                id={"type": "range-slider", "flag": flg},
                min=0,
                max=row_count - 1 if row_count > 0 else 0,
                value=[0, row_count - 1] if row_count > 0 else [0, 0],
                step=1,
                marks={0: "0", row_count - 1: str(row_count - 1)} if row_count > 0 else {},
                tooltip={"always_visible": False, "placement": "bottom"}
            ),
            html.Div(
                html.A("Download CSV", id={"type": "download-link", "flag": flg},
                       href=f"/download_csv?flag={flg}&start_index=0&end_index={row_count - 1}" if row_count > 0 else "#",
                       target="_blank"),
                className="download-link"
            )
        ], className="card")
        cards.append(card)

    msg = f"Parsed {len(data_by_flag)} flags from {filename}."
    return (msg, cards)

# -------------------------------------------------------------------
# Callback: Update Download Link Hrefs Based on Slider Value
# -------------------------------------------------------------------
@app.callback(
    Output({"type": "download-link", "flag": ALL}, "href"),
    Input({"type": "range-slider", "flag": ALL}, "value"),
    State({"type": "range-slider", "flag": ALL}, "id")
)
def update_download_links(slider_values, slider_ids):
    hrefs = []
    for value, comp_id in zip(slider_values, slider_ids):
        flag = comp_id["flag"]
        start_index = value[0]
        end_index = value[1]
        href = f"/download_csv?flag={flag}&start_index={start_index}&end_index={end_index}"
        hrefs.append(href)
    return hrefs

# -------------------------------------------------------------------
# CSV Download Route
# -------------------------------------------------------------------
@server.route("/download_csv")
def download_csv():
    """
    For a given flag and day range (based on slider indices):
      - Convert 'start_date' to datetime, group by day (using the date part)
      - Take the maximum 'value' for each day in the group
      - Slice the grouped data based on the slider indices
      - Normalize timestamps: first day of the slice becomes 0 (days offset)
      - Rename 'value' -> 'metric'
      - Output CSV with columns [timestamp, metric]
      - File name => {flag}_{YYYY-MM-DD}-{YYYY-MM-DD}.csv from the slice's min and max dates.
    """
    flag = flask.request.args.get("flag")
    start_index = flask.request.args.get("start_index", type=int)
    end_index = flask.request.args.get("end_index", type=int)
    if not flag:
        return make_response("No flag specified.", 400)
    
    global data_by_flag
    if flag not in data_by_flag:
        return make_response("Flag not found in memory; re-upload needed.", 404)
    
    df = data_by_flag[flag]
    if df is None or df.empty:
        return make_response("No data for this flag (empty).", 404)
    
    if "start_date" not in df.columns or "value" not in df.columns:
        return make_response("Dataset missing 'start_date' or 'value' columns.", 400)
    
    df_tmp = df.copy()
    df_tmp["start_date"] = pd.to_datetime(df_tmp["start_date"], errors="coerce")
    df_tmp = df_tmp.dropna(subset=["start_date"]).sort_values("start_date")
    if df_tmp.empty:
        return make_response("No valid start_date after conversion.", 404)
    
    # Group by day (using the date part) and take max of 'value'
    grouped = df_tmp.groupby(df_tmp["start_date"].dt.date).agg({"value": "max"}).reset_index()
    if grouped.empty:
        return make_response("Grouping resulted in no data.", 404)
    
    # Slice the grouped DataFrame based on slider indices (inclusive)
    grouped_slice = grouped.iloc[start_index:end_index+1]
    if grouped_slice.empty:
        return make_response("No rows in the selected day range.", 404)
    
    # Normalize: first day becomes 0 (days offset)
    first_day = grouped_slice["start_date"].iloc[0]
    # Compute days offset
    grouped_slice["timestamp"] = grouped_slice["start_date"].apply(lambda d: (datetime.datetime.combine(d, datetime.time.min) - datetime.datetime.combine(first_day, datetime.time.min)).days)
    grouped_slice["metric"] = grouped_slice["value"]
    df_out = grouped_slice[["timestamp", "metric"]].dropna()
    if df_out.empty:
        return make_response("After transformation, no valid rows remain.", 404)
    
    # Filename from slice's min and max date
    min_date = grouped_slice["start_date"].min()
    max_date = grouped_slice["start_date"].max()
    start_str = min_date.strftime("%Y-%m-%d")
    end_str = max_date.strftime("%Y-%m-%d")
    csv_filename = f"{flag}_{start_str}-{end_str}.csv"
    
    buf = io.StringIO()
    df_out.to_csv(buf, index=False)
    buf.seek(0)
    
    mem = io.BytesIO(buf.getvalue().encode("utf-8"))
    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name=csv_filename)

# -------------------------------------------------------------------
# Run the App
# -------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=8050)

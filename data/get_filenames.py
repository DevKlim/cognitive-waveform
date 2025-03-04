import os


start_dir = "cognitive-waveform/data"
output_file = "cognitive-waveform/data/file_list.txt"

with open(output_file, "w") as f_out:
    for root, dirs, files in os.walk(start_dir):
        if '.git' in root:
            continue
        for file in files:
            if file.lower().endswith(".csv"):
                f_out.write("data/" + file + "\n")

print(f"File list written to {output_file}")

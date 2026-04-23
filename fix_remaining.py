import glob

def fix():
    files = glob.glob('src/features/**/*.tsx', recursive=True)
    for file_path in files:
        with open(file_path, 'r') as f:
            content = f.read()

        # Remove StyleSheet from import { ... } from 'react-native'
        import_rn = "from 'react-native'"
        if import_rn in content:
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if import_rn in line and 'StyleSheet' in line:
                    new_line = line.replace('StyleSheet,', '').replace(', StyleSheet', '').replace('StyleSheet', '')
                    # If it's just import {  } from 'react-native'; then drop it
                    if 'import {  }' in new_line or 'import {}' in new_line:
                        continue
                    new_lines.append(new_line)
                elif 'StyleSheet,' in line: # Multi-line import
                    new_lines.append(line.replace('StyleSheet,', ''))
                elif 'StyleSheet' in line and ('import' in line or 'from' in line): # Multi-line import edge case
                    new_lines.append(line.replace('StyleSheet', ''))
                else:
                    new_lines.append(line)

            content = '\n'.join(new_lines)

            with open(file_path, 'w') as f:
                f.write(content)

fix()

import os
import glob
import re

def remove_styles():
    files = glob.glob('src/features/**/*.tsx', recursive=True)
    for file_path in files:
        with open(file_path, 'r') as f:
            content = f.read()

        # Remove StyleSheet imports
        content = re.sub(r'import\s+{[^}]*StyleSheet[^}]*}\s+from\s+[\'"]react-native[\'"];?\n?', lambda m: m.group(0).replace('StyleSheet,', '').replace('StyleSheet', '').replace('import {  } from \'react-native\';\n', ''), content)
        content = re.sub(r'import\s+StyleSheet\s+from\s+[\'"]react-native[\'"];?\n?', '', content)

        # Remove any lingering createStyles declarations
        content = re.sub(r'const\s+createStyles\s*=\s*\([^)]*\)\s*=>\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)
        content = re.sub(r'const\s+styles\s*=\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)

        with open(file_path, 'w') as f:
            f.write(content)

remove_styles()

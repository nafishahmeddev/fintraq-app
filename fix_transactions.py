import os
import glob
import re

def fix_transactions():
    files = glob.glob('src/features/transactions/**/*.tsx', recursive=True)
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
                    if 'import {  }' in new_line or 'import {}' in new_line:
                        continue
                    new_lines.append(new_line)
                elif 'StyleSheet,' in line:
                    new_lines.append(line.replace('StyleSheet,', ''))
                elif 'StyleSheet' in line and ('import' in line or 'from' in line):
                    new_lines.append(line.replace('StyleSheet', ''))
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)

        content = re.sub(r'const\s+createStyles\s*=\s*\([^)]*\)\s*=>\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)
        content = re.sub(r'const\s+styles\s*=\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)
        content = re.sub(r'const\s+styles\s*=\s*useMemo\(\(\)\s*=>\s*createStyles\(colors\),\s*\[colors\]\);\n?', '', content)

        if 'TransactionFormPage.tsx' in file_path:
            pass # already manually updated properly
        elif 'TransactionsScreen.tsx' in file_path:
            pass # already manually updated properly

        with open(file_path, 'w') as f:
            f.write(content)

fix_transactions()

import glob

def fix():
    files = glob.glob('src/features/**/*.tsx', recursive=True)
    for file_path in files:
        with open(file_path, 'r') as f:
            content = f.read()

        if 'StyleSheet.absoluteFillObject' in content:
            content = content.replace('style={StyleSheet.absoluteFillObject}', 'className="absolute inset-0"')
            content = content.replace('style={[StyleSheet.absoluteFillObject,', 'className="absolute inset-0" style={[')

            with open(file_path, 'w') as f:
                f.write(content)

fix()

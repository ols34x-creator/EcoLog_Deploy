from flask import Flask, send_from_directory
import os
app = Flask(__name__, static_folder='.')
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')
@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory(os.path.join('.', 'assets'), filename)
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
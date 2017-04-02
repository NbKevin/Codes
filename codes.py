"""
This is the main executable of the project Codes.
"""

from flask import Flask
from flask import render_template

# main application
app = Flask(__name__)


@app.route('/test/<string:name>')
def test_page(name: str):
    return render_template('test/index.html', **locals())


# launch it
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

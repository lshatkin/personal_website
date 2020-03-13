import flask
import personal_website

@app.route('/')
def index():
    age = int((datetime.date.today() - datetime.date(1995, 4, 22)).days / 365)
    return flask.render_template('home.html', age=age)


import requests, json, random
from flask import Flask, render_template, request
app = Flask(__name__)

alameda_endpoint = "https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/Restaurant_Inspections/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json"

#refresh the cache
def get_data_alameda():
  data = requests.get(alameda_endpoint).json()
  f = open("cache/alameda.json", "w")
  f.write(json.dumps(data, indent=2))
  f.close()

  data_named = {}
  for restaurant in data["features"]:
    name = restaurant["attributes"]["Facility_Name"]
    if name in data_named:
      name = name +"_"+str(random.randint(0, 100))
    data_named[name] = restaurant
  f2 = open("cache/alameda_named.json", "w")
  f2.write(json.dumps(data_named, indent=2))
  f2.close()
  
  return data

#get restaurants, sorted by location
#example: https://hackathon-again.uniqueostrich18.repl.co/api/alameda/location?long=37.6608268&lat=-121.8753042&diff=10&limit=500
def get_data_alameda_location(longitude, latitude, diff, limit=None):
  f = open("cache/alameda.json", "r")
  data = json.loads(f.read())
  f.close()

  sorted_data = []

  for restaurant in data["features"]:
    geo = restaurant["geometry"]
    if geo["y"] >= longitude-diff and geo["y"] <= longitude+diff:
      if geo["x"] >= latitude-diff and geo["x"] <= latitude+diff:
        sorted_data.append(restaurant)

  if limit != None:
    sorted_data = random.sample(sorted_data, min(len(sorted_data),limit))
  return sorted_data

def get_data_alameda_search(query, limit=None):
  pass

@app.route('/')
def homepage():
  return render_template("homepage.html")

@app.route("/map")
def map():
  return render_template("map.html")

@app.route("/api/alameda/all")
def alameda_api():
  return get_data_alameda()

@app.route("/api/alameda/location")
def alameda_api_location():
  longitude = float(request.args.get("long"))
  latitude = float(request.args.get("lat"))
  diff = float(request.args.get("diff"))
  limit = request.args.get("limit")
  if limit != None:
    limit = int(limit)

  #raise Exception(longitude, latitude, diff)

  return {
    "restaurants": get_data_alameda_location(longitude, latitude, diff, limit)
  }

@app.route("/static/<path:path>")
def serveStaticFile(path):
  return send_from_directory("static", path)

if __name__ == "__main__":
  app.run(host="0.0.0.0")
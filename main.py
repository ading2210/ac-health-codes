import requests, json, random, time, threading
from datetime import datetime
from flask import Flask, render_template, request, redirect
app = Flask(__name__)

alameda_endpoint = "https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/Restaurant_Inspections/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json"

data_alameda, data_alameda_named = None, None

def cache_refresh():
  while True:
    time.sleep(6000)
    get_data_alameda()
threading.Thread(target=cache_refresh, daemon=True).start()

#refresh the cache
def get_data_alameda():
  print("Refreshing the cache!")
  data_alameda = requests.get(alameda_endpoint).json()
  f = open("cache/alameda.json", "w")
  f.write(json.dumps(data_alameda, indent=2))
  f.close()

  data_named = {}
  data_address = {}
  for restaurant in data_alameda["features"]:
    address = restaurant["attributes"]["Address"]
    if address in data_address:
      timestamp = restaurant["attributes"]["Activity_Date"]
      if timestamp < data_address[address]["attributes"]["Activity_Date"]:
        continue
    data_address[address] = restaurant
  for address in data_address.keys(): 
    restaurant = data_address[address]
    name = restaurant["attributes"]["Facility_Name"]
    if name in data_named:
      name += " " + str(random.randint(0, 100))
    data_named[name] = restaurant
    
  data_alameda_named = data_named
  f2 = open("cache/alameda_named.json", "w")
  f2.write(json.dumps(data_named, indent=2))
  f2.close()
  
  return data_alameda

#get restaurants, sorted by location
#example: https://hackathon-again.uniqueostrich18.repl.co/api/alameda/location?long=37.6608268&lat=-121.8753042&diff=10&limit=500
def get_data_alameda_location(longitude, latitude, diff, limit=None):
  data = data_alameda

  sorted_data = []

  for restaurant in data["features"]:
    geo = restaurant["geometry"]
    if geo["y"] >= longitude-diff and geo["y"] <= longitude+diff:
      if geo["x"] >= latitude-diff and geo["x"] <= latitude+diff:
        sorted_data.append(restaurant)

  if limit != None:
    sorted_data = random.sample(sorted_data, min(len(sorted_data),limit))
  return sorted_data

#gets restaurants from a search query
def get_data_alameda_search(query, limit=None):
  data_named = data_alameda_named

  query_split = query.lower().split(" ")
  results = []

  for restaurant in data_named.keys():
    name_split = restaurant.lower().split(" ")
    matches = list(set(name_split)&set(query_split))
    if len(matches) > 0:
      results.append([restaurant, len(matches)])

  for i in range(0, len(results)-1):
    for j in range(0, len(results)-i-1):
      if results[j][1] < results[j + 1][1] :
        results[j], results[j + 1] = results[j + 1], results[j]

  final_results = []
  for item in results:
    final_results.append(data_named[item[0]])
  if limit != None:
    final_results = final_results[:limit]
  return final_results

try:
  f1 = open("cache/alameda.json")
  data_alameda = json.loads(f1.read())
  f1.close()
  f2 = open("cache/alameda_named.json")
  data_alameda_named = json.loads(f2.read())
  f2.close()
except:
  get_data_alameda()
  f1 = open("cache/alameda.json")
  data_alameda = json.loads(f1.read())
  f1.close()
  f2 = open("cache/alameda_named.json")
  data_alameda_named = json.loads(f2.read())
  f2.close()

@app.route('/')
def homepage():
  return render_template("homepage.html")

@app.route("/map")
def map():
  return render_template("map.html")

@app.route("/favicon.ico")
def favicon():
  return send_from_directory("static", "static/img/icon.ico")

@app.route("/launch")
def launch():
  return render_template("launch.html")

@app.route("/details")
def get_details():
  facility_id = request.args.get("id")
  if facility_id == None:
    return "No ID provided"
  found = False
  for restaurant in data_alameda["features"]:
    id = restaurant["attributes"]["Facility_ID"]
    if facility_id == id:
      restaurant = restaurant["attributes"]
      found = True
      break
  if found:
    grade = restaurant["Grade"]
    if grade == "G":
      grade_pretty = "Pass"
    elif grade == "Y":
      grade_pretty = "Conditional Pass"
    elif grade == "R":
      grade_pretty = "Closed"
    else:
      grade_pretty = "Unknown"
      grade = "N"
    data_formatted = {
      "name": restaurant["Facility_Name"].title(),
      "address": restaurant["Facility_Name"].title() + ", " + restaurant["City"].title(),
      "violation": restaurant["Violation_Description"],
      "date": datetime.utcfromtimestamp(restaurant["Activity_Date"]//1000).strftime("%m-%d-%y"),
      "grade": grade_pretty,
      "grade_letter": grade
    }
    return render_template("details.html", **data_formatted)
  else:
    return "ID not found"

@app.route("/api/alameda/all")
def alameda_api():
  f = open("cache/alameda.json", "r")
  data = json.loads(f.read())
  f.close()
  return data

@app.route("/api/alameda/refresh_cache")
def alameda_api_refresh():
  get_data_alameda()
  return "done."

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

@app.route("/api/alameda/search")
def alameda_api_search():
  query = str(request.args.get("query"))
  limit = request.args.get("limit")
  if limit != None:
    limit = int(limit)
  return {
    "restaurants": get_data_alameda_search(query, limit)
  }

@app.route("/static/<path:path>")
def serveStaticFile(path):
  return send_from_directory("static", path)

if __name__ == "__main__":
  app.run(host="0.0.0.0")
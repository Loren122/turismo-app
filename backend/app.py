from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
import math

app = Flask(__name__)
CORS(app)

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

CATEGORIAS = ['cervecerías', 'universidades', 'farmacias', 'emergencias', 'supermercados']

@app.route('/api/puntos-interes', methods=['POST'])
def agregar_punto_interes():
    data = request.get_json()
    nombre = data.get('nombre')
    lat = data.get('latitud')
    lon = data.get('longitud')
    categoria = data.get('categoria')

    if not all([nombre, lat, lon, categoria]):
        return jsonify({'error': 'Faltan datos'}), 400

    if categoria not in CATEGORIAS:
        return jsonify({'error': 'Categoría no válida'}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({'error': 'Coordenadas inválidas'}), 400

    redis_client.geoadd(categoria, (lon, lat, nombre))
    return jsonify({'message': 'Punto de interés agregado'}), 201

@app.route('/api/puntos-cercanos', methods=['GET'])
def get_puntos_cercanos():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    categoria = request.args.get('categoria')

    if not lat or not lon:
        return jsonify({'error': 'Faltan coordenadas'}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({'error': 'Coordenadas inválidas'}), 400

    radio = 5
    unit = 'km'

    puntos_cercanos = {}
    categorias = [categoria] if categoria else CATEGORIAS

    for cat in categorias:
        results = redis_client.georadius(
            cat, lon, lat, radio, unit, withdist=True, withcoord=True, sort='ASC'
        )
        puntos_cercanos[cat] = [{
            'nombre' : result[0],
            'distancia' : f"{result[1]} {unit}",
            'coordenadas' : {
                'lat' : result[2][1],
                'lon' : result[2][0]}
            } for result in results] if results else []

    return jsonify(puntos_cercanos)

@app.route('/api/calcular-distancia', methods=['GET'])
def calcular_distancia():
    user_lat = request.args.get('user_lat')
    user_lon = request.args.get('user_lon')
    punto_nombre = request.args.get('punto_nombre')
    categoria = request.args.get('categoria')

    if not all([user_lat, user_lon, punto_nombre, categoria]):
        return jsonify({'error': 'Faltan datos'}), 400

    if categoria not in CATEGORIAS:
        return jsonify({'error': 'Categoría no válida'}), 400

    punto_coords = redis_client.geopos(categoria, punto_nombre)
    if not punto_coords or not punto_coords[0]:
        return jsonify({'error': 'Punto no encontrado'}), 404

    punto_lon, punto_lat = punto_coords[0]

    try:
        user_lat = float(user_lat)
        user_lon = float(user_lon)
        punto_lat = float(punto_lat)
        punto_lon = float(punto_lon)
    except ValueError:
        return jsonify({'error': 'Coordenadas inválidas'}), 400

    R = 6371  # Radio de la Tierra en km
    dlat = math.radians(punto_lat - user_lat)
    dlon = math.radians(punto_lon - user_lon)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(user_lat)) * math.cos(math.radians(punto_lat)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distancia = R * c

    return jsonify({'distancia': f"{distancia:.2f} km"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
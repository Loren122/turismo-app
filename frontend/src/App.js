import React, { useState } from 'react';
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    nombre: '',
    latitud: '',
    longitud: '',
    categoria: ''
  });
  const [userLocation, setUserLocation] = useState({
    latitud: '',
    longitud: ''
  });
  const [puntosCercanos, setPuntosCercanos] = useState(null);
  const [distancia, setDistancia] = useState(null);

  const handleAddPunto = async (e) => {
    e.preventDefault();
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/puntos-interes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      alert('Punto agregado correctamente');
      setFormData({
        nombre: '',
        latitud: '',
        longitud: '',
        categoria: ''
      });
    }
  };

  const handleEncontrarPuntos = async () => {

    if (!userLocation.latitud || !userLocation.longitud) {
      alert('Por favor, ingresa tu ubicación');
      return;
    }

    try {

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/puntos-cercanos?lat=${userLocation.latitud}&lon=${userLocation.longitud}`
      );
      const data = await response.json();

      const puntosFormateados = Object.entries(data).reduce((acc, [categoria, puntos]) => {
        acc[categoria] = Array.isArray(puntos) ? puntos : [];
        return acc;
      }, {});

      setPuntosCercanos(puntosFormateados);
    } catch (error) {
        console.error('Error al encontrar puntos cercanos:', error);
        alert('Error al encontrar puntos cercanos');
      }
    };

    const handleGetDistancia = async (puntoNombre, categoria) => {

      if (distancia?.punto === puntoNombre) {
        setDistancia(null);
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/calcular-distancia?user_lat=${userLocation.latitud}&user_lon=${userLocation.longitud}&punto_nombre=${puntoNombre}&categoria=${categoria}`
      );
      const data = await response.json();
      setDistancia({
        punto: puntoNombre,
        distancia: data.distancia
      });
    };

    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Turismo API</h1>
        </header>
        <main className="app-main">
          <section className="form-section">
            <h2>Agregar Punto de Interés</h2>
            <form className="point-form" onSubmit={handleAddPunto}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre del lugar:</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="latitud">Latitud:</label>
                <input
                  id="latitud"
                  type="number"
                  step="any"
                  placeholder="Latitud"
                  value={formData.latitud}
                  onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitud">Longitud:</label>
                <input
                  id="longitud"
                  type="number"
                  step="any"
                  placeholder="Longitud"
                  value={formData.longitud}
                  onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría:</label>
                <select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="cervecerías">Cervecerías</option>
                  <option value="universidades">Universidades</option>
                  <option value="farmacias">Farmacias</option>
                  <option value="emergencias">Emergencias</option>
                  <option value="supermercados">Supermercados</option>
                </select>
              </div>

              <button type="submit" className="submit-btn">Agregar Punto</button>
            </form>
          </section>

          <section className="location-section">
            <h2>Tu ubicación</h2>
            <div className="location-inputs">
              <div className="form-group">
                <label htmlFor="user-lat">Tu Latitud:</label>
                <input
                  id="user-lat"
                  type="number"
                  step="any"
                  placeholder="Latitud"
                  value={userLocation.latitud}
                  onChange={(e) => setUserLocation({ ...userLocation, latitud: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-lon">Tu Longitud:</label>
                <input
                  id="user-lon"
                  type="number"
                  step="any"
                  placeholder="Longitud"
                  value={userLocation.longitud}
                  onChange={(e) => setUserLocation({ ...userLocation, longitud: e.target.value })}
                />
              </div>
            </div>
            <button onClick={handleEncontrarPuntos} className="action-btn">Encontrar Puntos Cercanos</button>
          </section>

          {puntosCercanos && (
            <section className="results-section">
              <h2>Resultados</h2>
              {Object.entries(puntosCercanos).map(([categoria, puntos]) => (
                <div key={categoria} className="category-group">
                  <h3 className="category-title">
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </h3>
                  <ul className="points-list">
                    {puntos.map((punto) => (
                      <li key={punto.nombre} className="point-item">
                        <span className="point-name">{punto.nombre}</span>
                        {distancia?.punto === punto.nombre ? (
                          <span className="exact-distance">Distancia: {distancia.distancia}</span>
                        ) : (
                          <button 
                            onClick={() => handleGetDistancia(punto.nombre, categoria)}
                            className="distance-btn"
                          >
                            Calcular Distancia
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    );
}

export default App;
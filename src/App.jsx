import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Swal from 'sweetalert2';// Importamos la libreria para usar alertas bonitas

function App() {
    //ESTADO DE LOS JUGADORES
    const [players, setPlayers] = useState([]);

    // NUEVOS ESTADOS: Necesitamos una "memoria" temporal para cada cajita del formulario
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [goals, setGoals] = useState('');
    const [teamId, setTeamId] = useState('');
    const [editingId, setEditingId] = useState(null); //Para que React recuerde que ID estamos editando
    const [searchTerm, setSearchTerm] = useState(''); // Este estado guardará el texto que el usuario escriba en el buscador
    

    //FUNCIÓN PARA EDITAR JUGADOR
    const handleEditClick = (player) =>{
        setName(player.name);
        setPosition(player.position);
        setGoals(player.goals_scored);
        setTeamId(player.teamId || ""); //Subimos los datos a los inputs
        setEditingId(player.id); //Guardamos el ID en la memoria
    }
    
    //FUNCION PARA BUSCAR 

    const fetchPlayers = async () => {
        try {
            const response = await axios.get('https://football-stats-api-f2aj.onrender.com/api/players');
            setPlayers(response.data)
        } catch (err) {
            console.error("Hubo un error al conectar con el servidor", err);
        }
    };
    useEffect(() => {
        fetchPlayers();
    }, []);

    //NUEVA FUNCIÓN: Se ejecuta al presionar "Guardar jugador"

    const handleCreatePlayer = async (e) => {
    e.preventDefault();
    try {
      // Empaquetamos los datos del formulario
      const playerData = { name, position, goals_scored: goals, team_id: teamId};

      if (editingId) {
        // SI ESTAMOS EN MODO EDICIÓN -> Hacemos PUT
        await axios.put(`https://football-stats-api-f2aj.onrender.com/api/players/${editingId}`, playerData);
        setEditingId(null); // Apagamos el modo edición al terminar

        //Nuevo Alerta: Exito a la hora de actualizar

        Swal.fire({
            title: '¡Actualizado!', //Titulo en grande
            text: 'La leyenda ha sido modificada de forma exitosa',//Texto explicativo
            icon:'success', //Muestra un chulito verde animado
            confirmButtonText:'Genial'// Texto del botón
        });

      } else {
        // SI ES UN JUGADOR NUEVO -> Hacemos POST
        await axios.post('https://football-stats-api-f2aj.onrender.com/api/players', playerData);

         Swal.fire({
            title: '¡Fichaje exitoso!', 
            text: 'El jugador ha sido guardado en tu base de datos',
            icon:'success', 
            confirmButtonText:'Excelente'
        });
      }

      // Limpiamos todos los inputs
      setName('');
      setPosition('');
      setGoals('');
      setTeamId('');
      
      // Volvemos a pedir la lista actualizada a PostgreSQL
      fetchPlayers();

    } catch (err) {
      console.error("Error al guardar el jugador:", err);

       Swal.fire({
            title: '¡Ups!', 
            text: 'Hubo un problema al guardar los datos',
            icon:'error', //Muestra una X roja animada
            confirmButtonText:'Entendido'
        });
    }
  };
    //Eliminar tarjeta del jugador

    //Esta función recibe el id del jugador como parametro

    const handleDeletePlayer = async (id) => {

        //Guardamos la respuesta del usuario en la variable result

        const result = await Swal.fire({
            title: '¿Estas completamente seguro?',
            text:'¡No podrás revertir esto!',
            icon: 'warning', // Muestra un símbolo de advertencia amarillo
            showCancelButton: true, //Muestra el botón de cancelar
            confirmButtonColor: '#d33',//Pintamos el botón de confirmar rojo
            cancelButtonColor: '#3085d6',//Pintamos el de cancelar de azul
            confirmButtonText:'Sí, eliminar leyenda',
            cancelButtonText:'Cancelar'
        });


        //2. Si el usuario hace clic en Aceptar, procedemos a borrar
        if (result.isConfirmed) {
            try {
                //3.ENVIAR LA ORDEN: Usamos axios.delete y le pegamos el 'id' al final de la URL
                await axios.delete(`https://football-stats-api-f2aj.onrender.com/api/players/${id}`);

                //4. ACTUALIZAR PANTALLA: Volvemos a pedir la lista de jugadores de la bd
                fetchPlayers();

                //Mostramos un alerta final avisando que ya no existe
                Swal.fire(
                    '¡Eliminado!',
                    'El jugador ha sido borrado de tu equipo',
                    'success'
                );

            } catch (err) {
                console.error("Error al intentar eliminar al jugador", err);
                Swal.fire(
                    'Error',
                    'No se pudo eliminar al jugador.',
                    'error'
                 );
            }
        }
    };

    //Logica de filtrado

    const filteredPlayers = players.filter((player) => {
        return player.name.toLowerCase().includes(searchTerm.toLocaleLowerCase());
    });

    //LÓGICA DEL PANEL DE ESTADISTICAS

    //Sumamos todos los goles del arreglo 'players'
    const totalGoals = players.reduce((acumulator, player) => {
        return acumulator + Number(player.goals_scored || 0);
    }, 0);

    //Buscamos al jugador con el número maximo de goles
    const topScorer =players.reduce((max, player)=> {
        return (Number(player.goals_scored)> Number(max.goals_scored || 0)) ? player :max;
    },{});

    return (
        <div className='container'>
            <h1>Leyendas del Fútbol Colombiano</h1>
            {/*TARJETA DE ESTADISTICAS AQUI*/}
            
            <div className="stats-wrapper">
                <div className='stats-card'>
                <h3>Resumen del torneo</h3>
                <p><strong>Total de Goles Históricos: </strong>{totalGoals}</p>

                {topScorer.name && (
                    <p><strong>Máximo Goleador:</strong> {topScorer.name} ({topScorer.goals_scored} goles)</p>
                )}
            </div>
        </div>
            
            {/* Formulario*/}
            <form onSubmit={handleCreatePlayer} className="player-form">
                <h3>Agregar Nueva Leyenda</h3>
                {/* Cada input esta conectado a su estado (value) y se actualiza al escribir (onChange) */}
                <input
                    type="text"
                    placeholder="Nombre del jugador"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                
                <select value={position} onChange={(e) => setPosition(e.target.value)} required>
                    <option value="" disabled>Selecciona una posición</option>
                    <option value="Arquero">Arquero</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Mediocampista">Mediocampista</option>
                    <option value="Delantero">Delantero</option>
                </select>

                <input
                    type="number"
                    placeholder="Goles anotados"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    required
                />

                {/*Usamos un selector simple para los equipos basados en los ID de tu bd*/}
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                    <option value="" disabled>Selecciona un equipo</option>
                    <option value="1">Deportes Tolima</option>
                    <option value="2">Junior FC</option>
                    <option value="3">Millonarios</option>
                    <option value="5">Atlético Nacional</option>
                    <option value="4">Selección Colombia</option>
                </select>
                
                <button type="submit">Guardar jugador</button>
            </form>

            {/*INPUT DEL BUSCADOR (FILTRO)*/}
            <div className="search-container">
                {/*1. Usamos un div contenedor para poder centrarlo con CSS luego*/}
                <input type="text" //Definimos que es un campo de texto
                placeholder="Buscar leyenda por nombre...." //El texto ayuda con un emoji
                className="search-input" // Clase para estilo en App.css
                value={searchTerm} // 2. CONEXIÓN: El input muestra lo que hay en el estado 'searchTerm'
                onChange={(e) => setSearchTerm(e.target.value)} //3. ACTUALIZACIÓN: Cada vez que el usuario presiona una tecla, guardamos esa letra en el estado
                />
            </div>
            
            {/* AQUI RESTAURAMOS LA CUADRICULA QUE SE HABIA BORRADO */}
            <div className="players-grid">
                {filteredPlayers.map((player) => (
                    <div className="player-card" key={player.id}>
                        <h2>{player.name}</h2>

                        <p><strong>Posición: </strong> {player.position}</p>
                        <p><strong>Equipo: </strong> {player.team_name}</p>
                        <p className="goals">⚽ Goles: {player.goals_scored}</p>

                        {/*BOTON EDITAR */}
                        <button className='edit-btn' onClick={() => handleEditClick(player)}>
                            Editar
                        </button>

                        {/* BOTON ELIMINAR */}
                        <button className="delete-btn" onClick={() => handleDeletePlayer(player.id)}>
                            Eliminar
                        </button>

                    </div>
                ))}
            </div> 

        </div> 

    );
}
export default App;
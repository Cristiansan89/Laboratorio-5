package pkg

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"math/big"
	"sync"

	grpc "google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// cantidad de nodos
const NODOS = 3

// mapas de nodos (id : puerto)
var MapaNodos = map[string]string{
	"0": "12345",
	"1": "12346",
	"2": "12347",
}

// define donde almacenar
func hash(clave string) (resultado string) {
	num := big.NewInt(0)
	nodos := big.NewInt(NODOS)
	nodo := big.NewInt(0)
	h := md5.New()
	h.Write([]byte(clave))
	hexstr := hex.EncodeToString(h.Sum(nil))
	if _, success := num.SetString(hexstr, 16); !success {
		// Manejar el error si no se puede convertir la cadena a un número
		return ""
	}
	nodo.Mod(num, nodos)
	return nodo.String()
}

// conexion a servidor que tiene la clave
func conectarServidor(id string) BaseClient {
	// Obtener el puerto del nodo
	puerto := MapaNodos[id]
	// Crear conexion
	conn, err := grpc.Dial("localhost:"+puerto, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		panic(err)
	}
	// Crear cliente
	cliente := NewBaseClient(conn)
	return cliente
}

// La implementación del servidor
type Servidor struct {
	UnimplementedBaseServer
	// id nodo
	IdNodo string
	// cerrojo
	lock sync.RWMutex
	// base de datos
	kv map[string]string
}

// crea servidor
func NuevoServidor(idNodo string) Servidor {
	return Servidor{
		IdNodo: idNodo,
		lock:   sync.RWMutex{},
		kv:     make(map[string]string),
	}
}

// guardar en proto
func (s *Servidor) Guardar(ctx context.Context, p *ParametroGuardar) (*ResultadoGuardar, error) {
	// Obtener el nodo al que indica la clave y el valor del parámetro
	clave := p.Clave
	valor := p.Valor

	// Calcular el nodo al que pertenece
	nodoDestino := hash(clave)
	fmt.Println("Se guarda en el nodo:", nodoDestino, "- la clave:", p.Clave, "- el valor: ", p.Valor)

	// Si la clave pertenece a este nodo guardar en la base de datos local
	if s.IdNodo == nodoDestino {
		s.lock.Lock()
		defer s.lock.Unlock()
		s.kv[clave] = valor
		return &ResultadoGuardar{Clave: clave, Valor: 1, Error: ""}, nil
	}

	// Si la clave no pertenece a este nodo, envíar la solicitud al nodo correcto
	cliente := conectarServidor(nodoDestino)
	respuesta, err := cliente.Guardar(ctx, &ParametroGuardar{Clave: clave, Valor: valor})
	if err != nil {
		return nil, err
	}

	return respuesta, nil
}

// obtener en proto
func (s *Servidor) Obtener(ctx context.Context, p *ParametroObtenerEliminar) (*ResultadoObtenerEliminar, error) {

	fmt.Println("Operación Obtener - Clave:", p.Clave)

	// Obtener la clave del parámetro
	clave := p.Clave

	// Calcular el nodo al que pertenece la clave
	nodoDestino := hash(clave)

	// Si la clave pertenece a este nodo, obtener de la base de datos local
	if s.IdNodo == nodoDestino {
		s.lock.RLock()
		defer s.lock.RUnlock()
		valor, encontrado := s.kv[clave]
		if !encontrado {
			return &ResultadoObtenerEliminar{Error: "Clave no encontrada"}, nil
		}
		return &ResultadoObtenerEliminar{Valor: valor, Error: ""}, nil
	}

	// Si la clave no pertenece a este nodo, enviar la solicitud al nodo correcto
	cliente := conectarServidor(nodoDestino)
	respuesta, err := cliente.Obtener(ctx, &ParametroObtenerEliminar{Clave: clave})
	if err != nil {
		return nil, err
	}

	return respuesta, nil
}

// eliminar en proto
func (s *Servidor) Eliminar(ctx context.Context, p *ParametroObtenerEliminar) (*ResultadoObtenerEliminar, error) {
	// Obtener la clave del parámetro
	clave := p.Clave

	fmt.Println("Operación Eliminar - Clave:", clave)

	// Calcular el nodo al que pertenece la clave
	nodoDestino := hash(clave)

	// Si la clave pertenece a este nodo, eliminar de la base de datos local
	if s.IdNodo == nodoDestino {
		s.lock.Lock()
		defer s.lock.Unlock()
		_, encontrado := s.kv[clave]
		if !encontrado {
			return &ResultadoObtenerEliminar{Error: "Clave no encontrada"}, nil
		}
		delete(s.kv, clave)
		return &ResultadoObtenerEliminar{Error: ""}, nil
	}

	// Si la clave no pertenece a este nodo, enviar la solicitud al nodo correcto
	cliente := conectarServidor(nodoDestino)
	respuesta, err := cliente.Eliminar(ctx, &ParametroObtenerEliminar{Clave: clave})
	if err != nil {
		return nil, err
	}

	return respuesta, nil
}

package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"

	"google.golang.org/grpc"

	base "base/pkg"
)

func main() {
	// Uso os.Args para validar argumentos
	argumentos := os.Args[1:]
	if len(argumentos) != 1 {
		fmt.Println("Error: Se debe pasar un solo argumento, debe ser un valor de 0 a 2")
		os.Exit(1)
	}

	puerto, ok := base.MapaNodos[argumentos[0]]
	if !ok {
		fmt.Println("Error: El argumento debe ser un valor de 0 a 2")
		os.Exit(1)
	}

	// Crear el servidor gRPC
	servicio := base.NuevoServidor(argumentos[0])
	servidorReal := grpc.NewServer()
	base.RegisterBaseServer(servidorReal, &servicio)

	// Iniciar el servidor gRPC en el puerto especificado
	direccion := "localhost:" + puerto
	listen, error := net.Listen("tcp", direccion)

	// Comprobacion de fallo del server
	if error != nil {
		log.Fatalf("fallo al escuchar: %s: %v", direccion, error)
	}

	fmt.Println("Servidor: ", servicio.IdNodo, " - Inciando Puerto: ", listen.Addr().String())

	// Comprobacion de error al servir
	if err := servidorReal.Serve(listen); err != nil {
		log.Fatalf("Fallo al servir: %v", err)
	}

	// Cierre seguro
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	go func() {
		<-interrupt
		fmt.Println("\nSeñal de interrrupción recibida. Cerrando servidor...")
		servidorReal.GracefulStop()
	}()

}

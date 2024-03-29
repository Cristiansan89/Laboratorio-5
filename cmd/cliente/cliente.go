package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"time"

	MQTT "github.com/eclipse/paho.mqtt.golang"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	base "base/pkg"
)

func main() {
	conexion, _ := grpc.Dial(
		// dirección del servidor
		"localhost:12345",
		// indica que se debe conectar usando TCP sin SSL
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		// bloquea el hilo hasta que la conexión se establezca
		grpc.WithBlock(),
	)

	// crea un nuevo cliente gRPC sobre la conexión
	cliente := base.NewBaseClient(conexion)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	//ctx := context.Background()

	// Configuración del cliente MQTT
	opts := MQTT.NewClientOptions()
	opts.AddBroker("tcp://localhost:1883") // Dirección del servidor MQTT
	opts.SetClientID("mi-cliente")         // Identificador único del cliente MQTT

	// Creación del cliente MQTT
	client := MQTT.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		panic(token.Error())
	}

	// Configuración del handler de mensajes
	messageHandler := func(client MQTT.Client, msg MQTT.Message) {
		fmt.Printf("Tópico: %s -- ", msg.Topic())
		fmt.Printf("Mensaje: %s\n", msg.Payload())
		cliente.Guardar(ctx, &base.ParametroGuardar{Clave: msg.Topic(), Valor: string(msg.Payload())})
	}

	// Suscripción al tópico "datos/#"
	topic := "datos/#"
	if token := client.Subscribe(topic, 0, messageHandler); token.Wait() && token.Error() != nil {
		panic(token.Error())
	}

	// Canal para recibir señales de interrupción (Ctrl+C)
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	// Goroutine para esperar señales de interrupción
	go func() {
		<-interrupt
		fmt.Println("\nSe recibio una señal de interrupción. Desconectando...")
		defer client.Disconnect(250)
		os.Exit(0)
	}()

	// Esperar indefinidamente mientras se reciben mensajes
	for {
		time.Sleep(1 * time.Second)
	}

}

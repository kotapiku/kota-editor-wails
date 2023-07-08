package main

import (
	"context"
	"fmt"
	"os"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) Read(filepath string) string {
	// open file
	file, err := os.Open(filepath)
	if err != nil {
		fmt.Println("fail to open file: ", err)
	}
	defer file.Close()

	// read file
	content := make([]byte, 1024)
	count, err := file.Read(content)
	if err != nil {
		fmt.Println("fail to read file: ", err)
	}
	fmt.Printf("read %d bytes\n", count)

	return string(content[:count])
}

func (a *App) Save(filepath string, content string) {
	// open file
	file, err := os.Create(filepath)
	if err != nil {
		fmt.Println("fail to open file: ", err)
	}
	defer file.Close()

	// read file
	count, err := file.Write([]byte(content))
	if err != nil {
		fmt.Println("fail to write file: ", err)
	}
	fmt.Printf("write %d bytes\n", count)
}

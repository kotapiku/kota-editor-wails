package main

import (
	"context"
	"fmt"
	"os"

	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

type File struct {
	BaseName     string   `json:"basename"`
	AbsolutePath string   `json:"absolute_path"`
	SplitPath    []string `json:"split_path"`
}

func (a *App) SelectFile() File {
	filename, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a file",
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown Files", Pattern: "*.md"},
		},
	})
	if err != nil {
		fmt.Println("fail to select file: ", err)
	}
	fmt.Printf("selected file: %s\n", filename)
	return File{filepath.Base(filename), filename, strings.Split(filename, string(os.PathSeparator))}
}

func (a *App) ReadFile(filepath string) string {
	content, err := os.ReadFile(filepath)
	if err != nil {
		fmt.Println("fail to read file: ", err)
	}
	fmt.Printf("read %d bytes\n", len(content))
	return string(content)
}

func (a *App) SaveFile(filepath string, content string) {
	file, err := os.Create(filepath)
	if err != nil {
		fmt.Println("fail to open file: ", err)
	}
	defer file.Close()

	count, err := file.Write([]byte(content))
	if err != nil {
		fmt.Println("fail to write file: ", err)
	}
	fmt.Printf("write %d bytes\n", count)
}

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

type File struct {
	BaseName     string   `json:"basename"`
	AbsolutePath string   `json:"absolute_path"`
	SplitPath    []string `json:"split_path"`
}

type FileNode struct {
	CurrentDir File       `json:"current_dir"`
	IsDir      bool       `json:"is_dir"`
	Children   []FileNode `json:"children"`
}

func buildTree(dir string) FileNode {
	children := []FileNode{}
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if path == dir {
			return nil
		}
		if info.IsDir() {
			children = append(children, buildTree(path))
		} else {
			children = append(children, FileNode{buildFile(path), false, []FileNode{}})
		}
		return nil
	})
	if err != nil {
		fmt.Println("fail to build a directory tree: ", err)
	}

	return FileNode{buildFile(dir), true, children}
}

func (a *App) OpenDirectory() (FileNode, error) {
	directory, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a directory",
	})

	if err != nil {
		fmt.Println("fail to open directory: ", err)
		return FileNode{}, err
	}
	if directory == "" {
		return FileNode{}, fmt.Errorf("canceled")
	}

	fmt.Printf("selected directory: %s\n", directory)
	return buildTree(directory), nil
}

func splitPath(path string) []string {
	return strings.Split(path, string(os.PathSeparator))
}

func (a *App) RelativePath(base string, target string) string {
	return filepath.Dir(base) + "/" + target
}

func buildFile(name string) File {
	return File{filepath.Base(name), name, splitPath(name)}
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
	return buildFile(filename)
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

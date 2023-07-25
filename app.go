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
	BaseName     string `json:"basename"`
	AbsolutePath string `json:"absolute_path"`
	SplitPath    []string
}

type FileNode struct {
	Current  File       `json:"current_file"`
	IsDir    bool       `json:"is_dir"`
	Children []FileNode `json:"children"`
}

func buildTree(dir string) (FileNode, error) {
	children := []FileNode{}
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if path == dir {
			return nil
		}
		if info.IsDir() {
			next, err := buildTree(path)
			if err != nil {
				return err
			}
			children = append(children, next)
		} else {
			children = append(children, FileNode{buildFile(path), false, []FileNode{}})
		}
		return nil
	})
	if err != nil {
		fmt.Println("fail to build a directory tree: ", err)
		return FileNode{}, err
	}

	return FileNode{buildFile(dir), true, children}, nil
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

func (a *App) SelectFile() (File, error) {
	filename, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a file",
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown Files", Pattern: "*.md"},
		},
	})
	if err != nil {
		fmt.Println("fail to select file: ", err)
		return File{}, err
	}
	fmt.Printf("selected file: %s\n", filename)
	return buildFile(filename), nil
}

func (a *App) ReadFile(filepath string) (string, error) {
	content, err := os.ReadFile(filepath)
	if err != nil {
		fmt.Println("fail to read file: ", err)
		return "", err
	}
	fmt.Printf("read %d bytes\n", len(content))
	return string(content), nil
}

func (a *App) SaveFile(filepath string, content string) error {
	file, err := os.Create(filepath)
	if err != nil {
		fmt.Println("fail to open file: ", err)
		return err
	}
	defer file.Close()

	count, err := file.Write([]byte(content))
	if err != nil {
		fmt.Println("fail to write file: ", err)
		return err
	}
	fmt.Printf("write %d bytes\n", count)
	return nil
}

func (a *App) RenameFile(oldpath string, newname string) (string, error) {
	newpath := filepath.Dir(oldpath) + "/" + newname
	err := os.Rename(oldpath, newpath)
	if err != nil {
		fmt.Println("fail to rename file: ", err)
		return "", err
	}
	return newpath, nil
}

func (a *App) DeleteFile(filepath string) error {
	err := os.Remove(filepath)
	if err != nil {
		fmt.Println("fail to delete file: ", err)
		return err
	}
	return nil
}

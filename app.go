package main

import (
	"context"
	"errors"
	"fmt"
	"os"

	"path/filepath"

	toml "github.com/pelletier/go-toml"
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
}

type FileNode struct {
	Current  File       `json:"current_file"`
	IsDir    bool       `json:"is_dir"`
	Children []FileNode `json:"children"`
}

type Config struct {
	ProjectPath string `json:"project_path"`
	DailyDir    string `json:"daily_dir"`
}

func configPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return home + "/.kota_editor/config.toml", nil
}

func (*App) GetConfig() (Config, error) {
	// get config from ~/.kota_editor/config.toml
	var cfg Config
	configPath, err := configPath()
	if err != nil {
		return Config{}, err
	}
	doc, err := os.ReadFile(configPath)
	if err != nil {
		fmt.Println("fail to read file")
		return Config{}, err
	}
	if err := toml.Unmarshal([]byte(doc), &cfg); err != nil {
		return Config{}, err
	}
	if err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (a *App) SaveConfig(cfg Config) error {
	b, err := toml.Marshal(cfg)
	if err != nil {
		panic(err)
	}
	configPath, err := configPath()
	if err != nil {
		return err
	}
	a.SaveFile(configPath, string(b))
	fmt.Println(string(b))
	return nil
}

func (a *App) GetProject(cfg Config) (FileNode, error) {
	if cfg.ProjectPath == "" {
		return FileNode{}, fmt.Errorf("project path is empty")
	}
	node, err := buildTree(cfg.ProjectPath)
	if err != nil {
		fmt.Println("fail to build a directory tree: ", err)
		return FileNode{}, err
	}
	return node, nil
}

func buildTree(dir string) (FileNode, error) {
	node := FileNode{buildFile(dir), true, []FileNode{}}
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if path == dir {
			return nil
		}
		node, _ = addPath(node, path, info.IsDir())
		return nil
	})
	if err != nil {
		fmt.Println("fail to build a directory tree: ", err)
		return FileNode{}, err
	}
	return node, nil
}

func addPath(node FileNode, path string, isDir bool) (FileNode, bool) {
	if node.Current.AbsolutePath == filepath.Dir(path) {
		node.Children = append(node.Children, FileNode{buildFile(path), isDir, []FileNode{}})
		return node, true
	}
	flag := false
	for i, c := range node.Children {
		node.Children[i], flag = addPath(c, path, isDir)
		if flag {
			break
		}
	}
	return node, flag
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
	filenode, err := buildTree(directory)
	if err != nil {
		fmt.Println("fail to build a directory tree: ", err)
		return FileNode{}, err
	}
	return filenode, nil
}

func (a *App) RelativePath(base string, target string) string {
	return filepath.Dir(base) + "/" + target
}

func buildFile(name string) File {
	return File{filepath.Base(name), name}
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

func (a *App) CheckIfExists(filepath string) bool {
	_, err := os.Stat(filepath)
	return err == nil
}
func (a *App) NewFileDir(filepath string, isDir bool) error {
	if isDir {
		if err := os.Mkdir(filepath, 0777); err != nil {
			fmt.Println("fail to create directory: ", err)
			return err
		}
		return nil
	}
	if a.CheckIfExists(filepath) {
		return errors.New("the file already exists")
	}
	fp, err := os.Create(filepath)
	if err != nil {
		fmt.Println("fail to create file: ", err)
		return err
	}
	fp.Close()
	return nil
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

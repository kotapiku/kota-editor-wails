import React, { useState, useEffect } from "react";
import {
  Menu,
  Tree,
  Typography,
  Input,
  Row,
  Divider,
  Button,
  Layout,
  Dropdown,
} from "antd";
import {
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { fileAtom, fileStatusAtom } from "../../FileAtom";
import { useRecoilState } from "recoil";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import type { MenuProps } from "antd";
import {
  OpenDirectory,
  RenameFile,
  NewFileDir,
  DeleteFile,
} from "../../../wailsjs/go/main/App";
import { main } from "../../../wailsjs/go/models";

const { Sider } = Layout;
const { Text } = Typography;
const { DirectoryTree } = Tree;

// TODO: if not md then disabled: true
function fromFileToDataNode(node: main.FileNode): DataNode {
  return {
    key: node.current_file.absolute_path,
    icon: node.is_dir ? <FolderOutlined /> : <FileOutlined />,
    children: node.is_dir // undefined if node is file
      ? node.children.map((child) => fromFileToDataNode(child))
      : undefined,
    title: node.current_file.basename,
  };
}

type RenameOrNewFile = RenameFile | NewFile;
type RenameFile = {
  kind: "rename";
  filepath: string;
};
type NewFile = {
  kind: "new";
  filepath: string;
  isDir: boolean;
};

export const Sidebar: React.FC = () => {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const [_, setFileStatus] = useRecoilState(fileStatusAtom);
  const [projects, setProjects] = useState<DataNode[]>([]);
  const [renameOrNewFile, setRenameOrNewFile] = useState<
    undefined | RenameOrNewFile
  >(undefined);

  const openProject = async () => {
    let dir = await OpenDirectory();
    console.log("selected file: ", dir.current_file);
    if (
      !projects.find((el) =>
        el == null ? false : el.key == dir.current_file.absolute_path
      )
    ) {
      console.log(projects);
      console.log(fromFileToDataNode(dir));
      setProjects([...projects, fromFileToDataNode(dir)]);
    }
  };
  const onExpand: DirectoryTreeProps["onExpand"] = (keys, info) => {
    console.log("Trigger Expand", keys, info);
  };

  const onClickFile: DirectoryTreeProps["onSelect"] = (keys, info) => {
    console.log("selected file: ", info.node);
    if (info.node.children == undefined) {
      setFilePath(info.node.key);
    }
  };

  const generateFileMenu = (filepath: string): MenuProps["items"] => {
    return [
      {
        key: "rename",
        label: <span onClick={(e) => rename(filepath)}>rename</span>,
      },
      {
        key: "delete",
        label: <span onClick={(e) => deleteFile(filepath)}>delete</span>,
      },
    ];
  };
  const generateDirMenu = (filepath: string): MenuProps["items"] => {
    return [
      {
        key: "new file",
        label: <span onClick={(e) => newFile(filepath, false)}>new file</span>,
      },
      {
        key: "new directory",
        label: (
          <span onClick={(e) => newFile(filepath, true)}>new directory</span>
        ),
      },
      {
        key: "rename",
        label: <span onClick={(e) => rename(filepath)}>rename</span>,
      },
      {
        key: "delete",
        label: <span onClick={(e) => deleteFile(filepath)}>delete</span>,
      },
    ];
  };

  const inputRenameOrNew = (node: { title: string; key: string }) => {
    if (renameOrNewFile?.kind === "rename") {
      return (
        <Input
          defaultValue={node.title}
          onBlur={() => {
            setRenameOrNewFile(undefined);
          }}
          autoFocus
          onPressEnter={async (e: any) => {
            let renamedAPath = await RenameFile(node.key, e.target.value);
            let update = (el: DataNode) => {
              return {
                ...el,
                key: renamedAPath,
                title: e.target.value,
              };
            };
            setProjects(updateNodeRecursive(projects, node.key, update));
            setRenameOrNewFile(undefined);
            console.log("rename", renamedAPath);
          }}
        />
      );
    } else if (renameOrNewFile?.kind === "new") {
      return (
        <Input
          defaultValue={node.title}
          onBlur={() => {
            console.log("cancel to new ", node.key);
            setProjects(updateNodeRecursive(projects, node.key, undefined));
            setRenameOrNewFile(undefined);
            setFilePath(undefined);
          }}
          autoFocus
          onPressEnter={async (e: any) => {
            let savedAPath = await NewFileDir(
              node.key + e.target.value,
              renameOrNewFile.isDir
            );
            let update = (el: DataNode) => {
              return {
                ...el,
                key: node.key + e.target.value,
                title: e.target.value,
              };
            };
            setProjects(updateNodeRecursive(projects, node.key, update));
            setRenameOrNewFile(undefined);
            console.log("new", savedAPath);
          }}
        />
      );
    } else {
      return <Text>{node.title}</Text>;
    }
  };

  const rename = (filepath: string) => {
    setRenameOrNewFile({ kind: "rename", filepath: filepath });
  };
  const deleteFile = async (filepath: string) => {
    console.log("delete file", filepath);
    await DeleteFile(filepath);
    setProjects(updateNodeRecursive(projects, filepath, undefined));
    if (filepath == filePath) {
      setFilePath(undefined);
      setFileStatus("Saved");
    }
  };
  const newFile = (dirpath: string, isDir: boolean) => async () => {
    console.log("new file in ", dirpath);
    setProjects(newFileRecursive(projects, dirpath, isDir));
    console.log(projects);
    setRenameOrNewFile({ kind: "new", filepath: dirpath, isDir: isDir });
  };
  // delete: update=undefined, update: update=関数。
  function updateNodeRecursive(
    nodes: DataNode[],
    keyToUpdate: string,
    update: ((param: DataNode) => DataNode) | undefined
  ): DataNode[] {
    return nodes.flatMap((node) => {
      if (node.key === keyToUpdate) {
        return update == undefined ? [] : update(node);
      } else if (node.children) {
        node.children = updateNodeRecursive(node.children, keyToUpdate, update);
      }
      return node;
    });
  }

  function newFileRecursive(
    nodes: DataNode[],
    keyToDir: string,
    isDir: boolean
  ): DataNode[] {
    return nodes.map((node) => {
      if (node.key == keyToDir && node.children) {
        let newFile = new main.FileNode({
          current_file: { basename: "", absolute_path: keyToDir + "/" },
          is_dir: isDir,
          children: isDir ? [] : undefined,
        });
        node.children.push(fromFileToDataNode(newFile));
        return node;
      }
      if (node.children) {
        node.children = newFileRecursive(node.children, keyToDir, isDir);
      }
      return node;
    });
  }

  useEffect(() => {
    console.log("projects", projects);
  }, [projects]);

  return (
    <Sider theme="light">
      <div className="sidebar">
        <div className="projects">
          <Row
            style={{
              "justifyContent": "space-between",
              "alignItems": "center",
              "marginTop": "5px",
            }}
          >
            <Text strong type="secondary">
              Projects
            </Text>
            <Text type="secondary">
              <Button
                icon={<FolderOpenOutlined />}
                type="secondary"
                onClick={openProject}
                size="small"
              />
            </Text>
          </Row>
        </div>
        <Divider style={{ "marginBottom": "0px", "marginTop": "0px" }} />
        <DirectoryTree
          onSelect={onClickFile}
          onExpand={onExpand}
          selectedKeys={filePath == undefined ? [] : [filePath]}
          treeData={projects}
          titleRender={(node: {
            title: string;
            key: string;
            children: undefined | DataNode[];
          }) => {
            return (
              <Dropdown
                menu={{
                  items:
                    node.children == undefined
                      ? generateFileMenu(node.key)
                      : generateDirMenu(node.key),
                  onClick: (e: { domEvent: MouseEvent }) => {
                    e.domEvent.stopPropagation();
                  },
                }}
                trigger={["contextMenu"]}
              >
                {(renameOrNewFile?.kind === "rename" &&
                  renameOrNewFile?.filepath == node.key) ||
                (renameOrNewFile?.kind === "new" &&
                  renameOrNewFile?.filepath + "/" == node.key) ? (
                  inputRenameOrNew(node)
                ) : (
                  <Text>{node.title}</Text>
                )}
              </Dropdown>
            );
          }}
          defaultExpandAll
        />
      </div>
    </Sider>
  );
};

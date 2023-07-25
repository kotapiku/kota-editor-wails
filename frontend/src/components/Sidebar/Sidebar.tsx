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
import { fileAtom, fileStatusAtom, FileStatus } from "../../FileAtom";
import { useRecoilState } from "recoil";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import {
  OpenDirectory,
  RenameFile,
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

export const Sidebar: React.FC = () => {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);
  const [projects, setProjects] = useState<DataNode[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [renameFile, setRenameFile] = useState<undefined | string>(undefined);

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

  const generateFileMenu = (filepath: string) => (
    <Menu>
      <Menu.Item key="rename">
        <Button onClick={rename(filepath)} type="text">
          rename
        </Button>
      </Menu.Item>
      <Menu.Item key="delete">
        <Button onClick={deleteFile(filepath)} type="text">
          delete
        </Button>
      </Menu.Item>
    </Menu>
  );
  const generateDirMenu = (filepath: string) => (
    <Menu>
      <Menu.Item key="new file">
        <Button onClick={newFile(filepath, false)} type="text">
          new file
        </Button>
      </Menu.Item>
      <Menu.Item key="new directory">
        <Button onClick={newFile(filepath, true)} type="text">
          new directory
        </Button>
      </Menu.Item>
      <Menu.Item key="rename">
        <Button onClick={rename(filepath)} type="text">
          rename
        </Button>
      </Menu.Item>
      <Menu.Item key="delete">
        <Button onClick={deleteFile(filepath)} type="text">
          delete
        </Button>
      </Menu.Item>
    </Menu>
  );

  const rename = (filepath: string) => () => {
    console.log("edit name", filepath);
    setRenameFile(filepath);
  };
  const deleteFile = (filepath: string) => async () => {
    console.log("delete file", filepath);
    await DeleteFile(filepath);
    setProjects(updateNodeRecursive(projects, filepath, undefined));
    if (filepath == filePath) {
      setFilePath("");
      setFileStatus("Saved");
    }
  };
  const newFile = (dirpath: string, isDir: boolean) => async () => {
    console.log("new file", dirpath);
    setProjects(newFileRecursive(projects, dirpath, isDir));
    setRenameFile(dirpath + "/");
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
      }
      if (node.children) {
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
      if (node.key === keyToDir && node.children) {
        let newFile = new main.FileNode({
          current_file: { basename: "", absolute_path: keyToDir + "/" },
          is_dir: isDir,
          children: [],
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
          selectedKeys={filePath == "" ? [] : [filePath]}
          treeData={projects}
          titleRender={(node: {
            title: string;
            key: string;
            children: undefined | DataNode[];
          }) => {
            return (
              <>
                <Dropdown
                  overlay={
                    node.children == undefined
                      ? generateFileMenu(node.key)
                      : generateDirMenu(node.key)
                  }
                  trigger={["contextMenu"]}
                >
                  {renameFile == node.key ? (
                    <Input
                      defaultValue={node.title}
                      onChange={(e: any) => {
                        setInputValue(e.target.value);
                      }}
                      onPressEnter={async (e: any) => {
                        let renamedAPath = await RenameFile(
                          node.key,
                          e.target.value
                        );
                        let update = (el: DataNode) => {
                          return {
                            ...el,
                            key: renamedAPath,
                            title: e.target.value,
                          };
                        };
                        setProjects(
                          updateNodeRecursive(projects, node.key, update)
                        );
                        setRenameFile(undefined);
                        console.log("rename", node.key, e.target.value);
                      }}
                    />
                  ) : (
                    <Text>{node.title}</Text>
                  )}
                </Dropdown>
              </>
            );
          }}
          defaultExpandAll
        />
      </div>
    </Sider>
  );
};

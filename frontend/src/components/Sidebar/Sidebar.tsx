import React, { useState, useEffect } from "react";
import {
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
  DownOutlined,
} from "@ant-design/icons";
import { fileAtom, fileStatusAtom, configAtom } from "../../FileAtom";
import { useRecoilState } from "recoil";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import type { MenuProps } from "antd";
import {
  OpenDirectory,
  RenameFile,
  NewFileDir,
  DeleteFile,
  GetProject,
} from "../../../wailsjs/go/main/App";
import { main } from "../../../wailsjs/go/models";

const { Sider } = Layout;
const { Text } = Typography;
const { DirectoryTree } = Tree;

// TODO: if not md then disabled: true
function fromFileToDataNode(node: main.FileNode): DataNode {
  return {
    key: node.current_file.absolute_path,
    icon: node.is_dir ? <></> : <FileOutlined />,
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
  const [config, setConfig] = useRecoilState(configAtom);
  const [dataNode, setDataNode] = useState<DataNode | undefined>(undefined);
  const [renameOrNewFile, setRenameOrNewFile] = useState<
    RenameOrNewFile | undefined
  >(undefined);

  const openProject = async () => {
    let dir = await OpenDirectory();
    console.log("open project: ", dir.current_file);
    setConfig(
      main.Config.createFrom({
        project_path: dir.current_file.absolute_path,
      })
    );
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
        label: "rename",
      },
      {
        key: "delete",
        label: "delete",
      },
    ];
  };
  const generateDirMenu = (filepath: string): MenuProps["items"] => {
    return [
      {
        key: "new file",
        label: "new file",
      },
      {
        key: "new directory",
        label: "new directory",
      },
      {
        key: "rename",
        label: "rename",
      },
      {
        key: "delete",
        label: "delete",
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
            // ignore enter for ime
            if (e.nativeEvent.keyCode != 229) {
              let renamedAPath = await RenameFile(node.key, e.target.value);
              let update = (el: DataNode) => {
                return {
                  ...el,
                  key: renamedAPath,
                  title: e.target.value,
                };
              };
              if (config.project_path == node.key) {
                console.log("change config by rename", renamedAPath);
                setConfig(
                  main.Config.createFrom({
                    project_path: renamedAPath,
                  })
                );
                setRenameOrNewFile(undefined);
              } else {
                if (dataNode != undefined) {
                  console.log("change datanode by rename", renamedAPath);
                  setDataNode(updateNodeRecursive(dataNode, node.key, update));
                  setRenameOrNewFile(undefined);
                }
              }
            }
          }}
        />
      );
    } else if (renameOrNewFile?.kind === "new") {
      return (
        <Input
          defaultValue={node.title}
          onBlur={() => {
            if (dataNode != undefined) {
              console.log("cancel to new ", node.key);
              setDataNode(updateNodeRecursive(dataNode, node.key, undefined));
              setRenameOrNewFile(undefined);
            }
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
            if (dataNode != undefined) {
              console.log("new", savedAPath);
              setDataNode(updateNodeRecursive(dataNode, node.key, update));
              setRenameOrNewFile(undefined);
            }
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
    await DeleteFile(filepath);

    if (config.project_path == filepath) {
      console.log("change config by delete");
      setConfig(main.Config.createFrom({}));
    } else {
      console.log("change datanode by delete");
      if (dataNode != undefined) {
        setDataNode(updateNodeRecursive(dataNode, filepath, undefined));
      }
    }
    if (filepath == filePath) {
      setFilePath(undefined);
    }
  };
  const newFile = async (dirpath: string, isDir: boolean) => {
    if (dataNode != undefined) {
      setDataNode(newFileRecursive(dataNode, dirpath, isDir));
      setRenameOrNewFile({ kind: "new", filepath: dirpath, isDir: isDir });
    }
  };
  // delete: update=undefined, update: update=関数。
  function updateNodeRecursive(
    node: DataNode,
    keyToUpdate: string,
    update: ((param: DataNode) => DataNode) | undefined
  ): DataNode {
    if (node.key === keyToUpdate) {
      return update == undefined ? node : update(node);
    } else if (node.children) {
      if (update == undefined) {
        node.children = node.children.filter((child) => {
          return child.key != keyToUpdate;
        });
      }
      node.children = node.children.map((child) =>
        updateNodeRecursive(child, keyToUpdate, update)
      );
    }
    return node;
  }

  function newFileRecursive(
    node: DataNode,
    keyToDir: string,
    isDir: boolean
  ): DataNode {
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
      node.children = node.children.map((child) =>
        newFileRecursive(child, keyToDir, isDir)
      );
    }
    return node;
  }

  useEffect(() => {
    if (config.project_path != "") {
      GetProject(config).then((project) => {
        console.log("get project", project);
        setDataNode(fromFileToDataNode(project));
      });
    }
  }, []);

  useEffect(() => {
    if (config.project_path != "") {
      GetProject(config).then((project) => {
        console.log("get project", project);
        setDataNode(fromFileToDataNode(project));
      });
    }
  }, [config]);

  useEffect(() => {
    setFileStatus("Saved");
  }, [filePath]);

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
              Project
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
          showLine
          switcherIcon={<DownOutlined />}
          onSelect={onClickFile}
          onExpand={onExpand}
          selectedKeys={filePath == undefined ? [] : [filePath]}
          treeData={dataNode == undefined ? [] : [dataNode]}
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
                  onClick: (e: { key: string; domEvent: MouseEvent }) => {
                    e.domEvent.stopPropagation();
                    console.log(e.key, node.key);
                    if (e.key === "rename") {
                      rename(node.key);
                    } else if (e.key === "delete") {
                      deleteFile(node.key);
                    } else if (e.key === "new file") {
                      newFile(node.key, false);
                    } else if (e.key === "new directory") {
                      newFile(node.key, true);
                    }
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
                  <Text
                    style={{
                      color: filePath === node.key ? "white" : "inherit",
                    }}
                  >
                    {node.title}
                  </Text>
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

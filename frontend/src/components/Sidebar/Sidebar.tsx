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
  message,
} from "antd";
import {
  FolderOpenOutlined,
  DownOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import * as path from "path-browserify";
import { fileAtom, fileStatusAtom, configAtom } from "../../FileAtom";
import { useRecoilState } from "recoil";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import {
  OpenDirectory,
  RenameFile,
  NewFileDir,
  DeleteFile,
  GetProject,
  CheckIfExists,
} from "../../../wailsjs/go/main/App";
import { main } from "../../../wailsjs/go/models";
import {
  fromFileToDataNode,
  updateNodeRecursive,
  newFileRecursive,
} from "./DataNode";

const { Sider } = Layout;
const { Text } = Typography;
const { DirectoryTree } = Tree;

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
  const [messageApi, contextHolder] = message.useMessage();

  const openProject = async () => {
    await OpenDirectory()
      .then((dir) => {
        console.log("open project: ", dir.current_file);
        setConfig(
          main.Config.createFrom({
            project_path: dir.current_file.absolute_path,
          })
        );
      })
      .catch((err) => {
        messageApi.error(err);
      });
  };
  const openTodaysNote = async () => {
    const today = new Date();
    const dirPath = path.join(config.project_path, config.daily_dir);
    const fileName =
      [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        today.getDate(),
      ].join("-") + ".md";
    const todaysNote = path.join(dirPath, fileName);
    let exists = await CheckIfExists(todaysNote);
    if (exists) {
      console.log("open today's note: ", todaysNote);
      setFilePath(todaysNote);
    } else {
      console.log("create today's note: ", todaysNote);
      await NewFileDir(todaysNote, false)
        .then(() => {
          if (dataNode != undefined) {
            setDataNode(newFileRecursive(dataNode, dirPath, fileName, false));
            console.log("open today's note: ", todaysNote);
            setFilePath(todaysNote);
          }
        })
        .catch((err) => {
          messageApi.error(err);
        });
    }
  };

  const onClickFile: DirectoryTreeProps["onSelect"] = (keys, info) => {
    console.log("selected file: ", info.node);
    if (info.node.children == undefined) {
      setFilePath(info.node.key);
    }
  };

  // right click menus
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
              await RenameFile(node.key, e.target.value)
                .then((renamedAPath) => {
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
                      setDataNode(
                        updateNodeRecursive(dataNode, node.key, update)
                      );
                      setRenameOrNewFile(undefined);
                    }
                  }
                })
                .catch((err) => {
                  messageApi.error(err);
                });
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
            // ignore enter for ime
            if (e.nativeEvent.keyCode != 229) {
              await NewFileDir(node.key + e.target.value, renameOrNewFile.isDir)
                .then(() => {
                  console.log("new file/dir");
                  let update = (el: DataNode) => {
                    return {
                      ...el,
                      key: node.key + e.target.value,
                      title: e.target.value,
                    };
                  };
                  if (dataNode != undefined) {
                    setDataNode(
                      updateNodeRecursive(dataNode, node.key, update)
                    );
                    setRenameOrNewFile(undefined);
                  }
                })
                .catch((err) => {
                  messageApi.error(err);
                });
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
    await DeleteFile(filepath)
      .then(() => {
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
      })
      .catch((err) => {
        messageApi.error(err);
      });
  };
  const newFile = (dirpath: string, isDir: boolean) => {
    if (dataNode != undefined) {
      setDataNode(newFileRecursive(dataNode, dirpath, "", isDir));
      setRenameOrNewFile({ kind: "new", filepath: dirpath, isDir: isDir });
    }
  };
  const fileMenus = [
    { key: "rename", fun: rename },
    { key: "delete", fun: deleteFile },
  ];
  const dirMenus = fileMenus.concat([
    { key: "new file", fun: (k: string) => newFile(k, false) },
    { key: "new directory", fun: (k: string) => newFile(k, true) },
  ]);

  useEffect(() => {
    console.log(config);
    if (config.project_path != "") {
      GetProject(config)
        .then((project) => {
          console.log("get project", project);
          setDataNode(fromFileToDataNode(project));
        })
        .catch((err) => {
          messageApi.error(err);
        });
    }
  }, [config]);

  useEffect(() => {
    setFileStatus("Saved");
  }, [filePath]);

  return (
    <>
      {contextHolder}
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
                  icon={<CalendarOutlined />}
                  type="secondary"
                  onClick={openTodaysNote}
                  size="small"
                />
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
                    items: (node.children == undefined
                      ? fileMenus
                      : dirMenus
                    ).map((menu) => {
                      return { key: menu.key, label: menu.key };
                    }),
                    onClick: (e: { key: string; domEvent: MouseEvent }) => {
                      e.domEvent.stopPropagation();
                      console.log(e.key, node.key);
                      node.children == undefined
                        ? fileMenus
                            .find((menu) => menu.key === e.key)
                            ?.fun(node.key)
                        : dirMenus
                            .find((menu) => menu.key === e.key)
                            ?.fun(node.key);
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
    </>
  );
};

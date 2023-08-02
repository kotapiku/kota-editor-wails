import React, { useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
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
import {
  fileAtom,
  fileStatusAtom,
  configAtom,
  dataNodeAtom,
} from "../../FileAtom";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import {
  OpenDirectory,
  RenameFile,
  SaveFile,
  NewFileDir,
  DeleteFile,
  GetProject,
  CheckIfExists,
  GetDailyTemplate,
} from "../../../wailsjs/go/main/App";
import { main } from "../../../wailsjs/go/models";
import {
  fromFileToDataNode,
  updateNodeRecursive,
  newFileRecursive,
} from "./DataNode";
import "../../App.css";

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
  const setFileStatus = useSetRecoilState(fileStatusAtom);
  const [config, setConfig] = useRecoilState(configAtom);
  const [dataNode, setDataNode] = useRecoilState<DataNode | undefined>(
    dataNodeAtom
  );
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
    console.log(config);
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
      return;
    }

    console.log("create today's note: ", todaysNote);
    await NewFileDir(todaysNote, false)
      .then(async () => {
        if (dataNode != undefined) {
          console.log("success to new daily note");
          const newNode = newFileRecursive(dataNode, dirPath, fileName, false);
          setDataNode({ ...newNode });
        }
        const template = await GetDailyTemplate();
        SaveFile(todaysNote, template)
          .then(() => {
            console.log("success to write daily template");
            console.log(template);
          })
          .catch((err) => {
            messageApi.error(err);
            return;
          });
        console.log("open today's note: ", todaysNote);
        setFilePath(todaysNote);
      })
      .catch((err) => {
        messageApi.error(err);
      });
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
            if (e.nativeEvent.keyCode === 229) {
              return;
            }
            await RenameFile(node.key, e.target.value)
              .then((renamedAPath) => {
                let update = (el: DataNode) => {
                  return {
                    ...el,
                    key: renamedAPath,
                    title: e.target.value,
                  };
                };
                if (config.project_path === node.key) {
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
                    const newNode = updateNodeRecursive(
                      dataNode,
                      node.key,
                      update
                    );
                    setDataNode({ ...newNode });
                    setRenameOrNewFile(undefined);
                  }
                }
              })
              .catch((err) => {
                messageApi.error(err);
              });
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
              const newNode = updateNodeRecursive(
                dataNode,
                node.key,
                undefined
              );
              setDataNode({ ...newNode });
              setRenameOrNewFile(undefined);
            }
          }}
          autoFocus
          onPressEnter={async (e: any) => {
            // ignore enter for ime
            if (e.nativeEvent.keyCode !== 229) {
              await NewFileDir(node.key + e.target.value, renameOrNewFile.isDir)
                .then(() => {
                  let update = (el: DataNode) => {
                    return {
                      ...el,
                      key: node.key + e.target.value,
                      title: e.target.value,
                    };
                  };
                  if (dataNode != undefined) {
                    const newNode = updateNodeRecursive(
                      dataNode,
                      node.key,
                      update
                    );
                    setDataNode({ ...newNode });
                    setRenameOrNewFile(undefined);
                  }
                  console.log("new file/dir", dataNode);
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
  async function deleteFile(filepath: string) {
    await DeleteFile(filepath)
      .then(() => {
        if (config.project_path == filepath) {
          console.log("change config by delete");
          setConfig(main.Config.createFrom({}));
        } else {
          if (dataNode != undefined) {
            const newNode = updateNodeRecursive(dataNode, filepath, undefined);
            setDataNode({ ...newNode });
          }
        }
        if (filepath == filePath) {
          setFilePath(undefined);
        }
        console.log("deleted", dataNode);
      })
      .catch((err) => {
        messageApi.error(err);
      });
  }
  const newFile = (dirpath: string, isDir: boolean) => {
    if (dataNode != undefined) {
      const newNode = newFileRecursive(dataNode, dirpath, "", isDir);
      setDataNode({ ...newNode });
      setRenameOrNewFile({ kind: "new", filepath: dirpath, isDir: isDir });
    }
  };
  const setDailyDir = (dirpath: string) => {
    console.log("set daily dir: ", path.relative(config.project_path, dirpath));
    setConfig(
      main.Config.createFrom({
        ...config,
        daily_dir: path.relative(config.project_path, dirpath),
      })
    );
  };

  const fileMenus = [
    { key: "Rename", fun: rename },
    { key: "Delete", fun: deleteFile },
  ];
  const dirMenus = fileMenus.concat([
    { key: "New file", fun: (k: string) => newFile(k, false) },
    { key: "New directory", fun: (k: string) => newFile(k, true) },
    { key: "Set in daily directory", fun: setDailyDir },
  ]);

  useEffect(() => {
    console.log("changed", config);
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

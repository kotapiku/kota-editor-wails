import { useState, useEffect } from "react";
import { Editor } from "./components/Editor";
import { OpenDirectory } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { Tree, Col, Row, Divider, Typography, Button, Layout } from "antd";
import type { MenuProps } from "antd";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import {
  FolderOpenOutlined,
  FolderOutlined,
  FileOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "./App.css";
import { fileAtom, fileStatusAtom, FileStatus } from "./FileAtom";
import { useRecoilState } from "recoil";

const { Header, Content, Sider, Footer } = Layout;
type MenuItem = Required<MenuProps>["items"][number];
const { Text } = Typography;
const { DirectoryTree } = Tree;

// TODO: if not md then disabled: true
function fromFileToDataNode(node: main.FileNode): DataNode {
  return {
    key: node.current_dir.absolute_path,
    icon: node.is_dir ? <FolderOutlined /> : <FileOutlined />,
    title: node.current_dir.basename,
    children: node.is_dir
      ? node.children.map((child) => fromFileToDataNode(child))
      : undefined,
  };
}

export function App() {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);
  const [projects, setProjects] = useState<DataNode[]>([]);

  const onClickDir = async () => {
    let dir = await OpenDirectory();
    console.log("selected file: ", dir.current_dir);
    if (
      !projects.find((el) =>
        el == null ? false : el.key == dir.current_dir.absolute_path
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

  function statusIcon(status: FileStatus) {
    switch (status) {
      case "Saved":
        return <CheckCircleOutlined />;
      case "Unsaved":
        return <WarningOutlined />;
      case "Saving":
        return <LoadingOutlined />;
    }
  }

  // keymap
  useEffect(() => {
    const hundleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "o") {
        event.preventDefault();
        console.log("open file");
        onClickDir();
      }
    };
    window.addEventListener("keydown", hundleKeyDown);
    return () => {
      window.removeEventListener("keydown", hundleKeyDown);
    };
  }, [projects]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
                  onClick={onClickDir}
                  size="small"
                />
              </Text>
            </Row>
          </div>
          <Divider style={{ "marginBottom": "0px", "marginTop": "0px" }} />
          <DirectoryTree
            defaultExpandAll
            onSelect={onClickFile}
            onExpand={onExpand}
            selectedKeys={filePath == "" ? [] : [filePath]}
            treeData={projects}
          />
        </div>
      </Sider>
      <Layout style={{ marginLeft: "0px" }}>
        <Content>
          <Editor />
        </Content>
        <Footer
          style={{
            textAlign: "center",
            position: "sticky",
            bottom: 0,
            padding: "5px",
            width: "100%",
            height: "28px",
          }}
        >
          <Row
            style={{
              justifyContent: "end",
              alignItems: "center",
              marginRight: "10px",
              fontSize: "18px",
            }}
          >
            {statusIcon(fileStatus)}
          </Row>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;

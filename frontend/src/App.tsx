import React, { useEffect, useState } from "react";
import { Editor } from "./components/Editor";
import { OpenDirectory, SelectFile } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { Tree, Breadcrumb, Button, Layout, Menu } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import "./App.css";

const { Header, Content, Sider } = Layout;
const { DirectoryTree } = Tree;

function fromFileNode(node: main.FileNode): DataNode {
  return {
    title: node.current_dir.basename,
    key: node.current_dir.absolute_path,
    selectable: !node.is_dir,
    isLeaf: !node.is_dir,
    children: node.children.map((child) => fromFileNode(child)),
  };
}

function App() {
  const [filePath, setFilePath] = useState<string>();
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  const onClick = async () => {
    let file = await SelectFile();
    console.log("selected file: ", file.absolute_path);
    setFilePath(file.absolute_path);
  };

  const onClickDir = async () => {
    let dir = await OpenDirectory();
    console.log("selected file: ", dir.current_dir);
    setTreeData([...treeData, fromFileNode(dir)]);
  };

  const onSelect: DirectoryTreeProps["onSelect"] = (keys, info) => {
    console.log("Trigger Select", keys, info);
    setFilePath(info.selectedNodes[0].key as string);
  };

  const onExpand: DirectoryTreeProps["onExpand"] = (keys, info) => {
    console.log("Trigger Expand", keys, info);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <Button icon={<UploadOutlined />} onClick={onClickDir}>
          Open directory
        </Button>
        <DirectoryTree
          defaultExpandAll
          onSelect={onSelect}
          onExpand={onExpand}
          treeData={treeData}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: "0 16px" }}>
          <Editor filepath={filePath} />
        </Content>
        {/* <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer> */}
      </Layout>
    </Layout>
  );
}

export default App;

import { useEffect, useState } from "react";
import { Editor } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import { AutoComplete, Modal, Row, Layout } from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "./App.css";
import { fileStatusAtom, FileStatus, configAtom } from "./FileAtom";
import { useRecoilState } from "recoil";
import { FSComponent } from "./components/FileSearch";

const { Sider, Content, Footer } = Layout;

export function App() {
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);
  const [config, setConfig] = useRecoilState(configAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  //   useEffect(() => {
  //     const hundleKeyDown = (event: KeyboardEvent) => {
  //       if ((event.metaKey || event.ctrlKey) && event.key === "p") {
  //         event.preventDefault();
  //         console.log("open file");
  //         setIsModalOpen(true);
  //       }
  //     };
  //     window.addEventListener("keydown", hundleKeyDown);
  //     return () => {
  //       window.removeEventListener("keydown", hundleKeyDown);
  //     };
  //   }, []);

  return (
    <Layout hasSider style={{ minHeight: "100vh" }}>
      <Sider
        style={{
          overflow: "auto",
          position: "fixed",
          left: "0",
          bottom: "0",
          top: "0",
        }}
        theme="light"
      >
        <Sidebar />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
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
      <FSComponent />
    </Layout>
  );
}

export default App;

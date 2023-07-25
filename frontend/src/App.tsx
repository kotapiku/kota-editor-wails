import { Editor } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import { Row, Layout } from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "./App.css";
import { fileStatusAtom, FileStatus } from "./FileAtom";
import { useRecoilState } from "recoil";

const { Content, Footer } = Layout;

export function App() {
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);

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
  //       if ((event.metaKey || event.ctrlKey) && event.key === "o") {
  //         event.preventDefault();
  //         console.log("open file");
  //         openProject();
  //       }
  //     };
  //     window.addEventListener("keydown", hundleKeyDown);
  //     return () => {
  //       window.removeEventListener("keydown", hundleKeyDown);
  //     };
  //   }, [projects]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
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

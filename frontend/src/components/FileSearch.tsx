import React, { useState, useEffect, useRef } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Input, AutoComplete, Modal } from "antd";
import { fileAtom, dataNodeAtom } from "../FileAtom";
import { fileOptions } from "./Sidebar/DataNode";

export const FSComponent: React.FC = () => {
  const setFilePath = useSetRecoilState(fileAtom);
  const dataNode = useRecoilValue(dataNodeAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoCompleteValue, setAutoCompleteValue] = useState("");
  const autoCompleteRef = useRef<typeof Input>(null);

  // keymap
  useEffect(() => {
    const hundleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        console.log("open file");
        setIsModalOpen(true);
      }
    };
    window.addEventListener("keydown", hundleKeyDown);
    return () => {
      window.removeEventListener("keydown", hundleKeyDown);
    };
  }, []);
  useEffect(() => {
    if (isModalOpen) {
      autoCompleteRef.current?.focus();
    }
    const hundleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "l") {
        event.preventDefault();
        console.log("focus on autocomplete");
        autoCompleteRef.current?.focus();
      }
    };
    window.addEventListener("keydown", hundleKeyDown);
    return () => {
      window.removeEventListener("keydown", hundleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <Modal
      open={isModalOpen}
      onOk={() => {
        setIsModalOpen(false);
      }}
      onCancel={() => {
        setIsModalOpen(false);
      }}
      footer={null}
      closable={false}
    >
      <AutoComplete
        ref={autoCompleteRef}
        placeholder="search files by name"
        style={{ width: "100%" }}
        autoFocus={true}
        options={fileOptions(dataNode)}
        value={autoCompleteValue}
        onChange={setAutoCompleteValue}
        onBlur={() => {
          setAutoCompleteValue("");
        }}
        onSelect={(value) => {
          console.log(value);
          setFilePath(value);
          setIsModalOpen(false);
        }}
        filterOption={(inputValue, option) =>
          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }
      />
    </Modal>
  );
};

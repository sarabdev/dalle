import {
  ChangeEvent,
  FC,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import HomeContext from '@/pages/api/home/home.context';

import Modal from './Modal';

// import { Plugin } from '@/types/plugin';

interface Props {
  lightMode: string;
  // onPluginChange: (plugin: Plugin) => void;
  // onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
}

export const PluginSelect: FC<Props> = ({
  lightMode,
  // onPluginChange,
  // onKeyDown,
}) => {
  const {
    state: { selectedConversation },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t } = useTranslation('chat');
  const [plugin, setPlugin] = useState({ id: '', name: '' });
  const [value, setValue] = useState('');
  const [showFileSelection, setShowFileSelection] = useState(false);
  const PluginList = [
    // {
    //   id:1,
    //   name:"Image"
    // },
    {
      id: '2',
      name: 'File',
    },
    {
      id: '3',
      name: 'Text',
    },
  ];
  const selectRef = useRef<HTMLSelectElement>(null);
  const [isPrepareText, setIsPrepareText] = useState(false);

  useEffect(() => {
    if (selectedConversation && selectedConversation.prompt) {
      setValue(selectedConversation.prompt);
    } else {
      setValue(DEFAULT_SYSTEM_PROMPT);
    }
  }, [selectedConversation]);
  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    if (selectedValue == '3') {
      setIsPrepareText(true);
      setShowFileSelection(false);
    } else if (selectedValue == '2') {
      setShowFileSelection(true);
      setIsPrepareText(true);
    } else {
      setShowFileSelection(false);
    }
  };

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);
  async function convertPdfToText(file: File) {
    try {
      // console.log(file);
      //const fileURL = URL.createObjectURL(file);
      //console.log(fileURL)
      const formData = new FormData();
      formData.append('file', file);
      // console.log(formData);
      const data = Object.fromEntries(formData.entries());
      // console.log(data);
      const controller = new AbortController();
      const response = await fetch('/api/getTextFromPdf', {
        method: 'POST',
        // headers:{
        //   'Content-Type': 'multipart/form-data ',
        // },
        body: formData,
      });
      const result = await response.json();
      if (!result.error)
        if (selectedConversation) {
          handleUpdateConversation(selectedConversation, {
            key: 'prompt',
            value: result.text,
          });
          setValue(result.text);
        }
    } catch (error) {
      console.error('Error converting PDF to text:', error);
    }
  }

  const handleUploadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      convertPdfToText(file);
    } else {
      setSelectedFile(null);
      alert('Please select a valid PDF file.');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = e.target.value;
    setValue(updatedContent);
    if (selectedConversation)
      handleUpdateConversation(selectedConversation, {
        key: 'prompt',
        value: updatedContent,
      });
  };
  return (
    <>
      {isPrepareText && (
        <div className="z-100 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              />

              <div
                style={{
                  backgroundColor: lightMode == 'light' ? 'white' : 'black',
                  color: lightMode == 'light' ? 'black' : 'white',
                }}
                className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
              >
                <div className="mb-4 text-2xl">Prepare AI</div>
                {showFileSelection && (
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUploadFile}
                  />
                )}
                <textarea
                  onChange={handleChange}
                  rows={20}
                  style={{
                    backgroundColor: lightMode == 'light' ? 'white' : 'black',
                    color: lightMode == 'light' ? 'black' : 'white',
                    borderColor: lightMode == 'light' ? 'black' : 'white',
                  }}
                  className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                  value={value}
                />

                <button
                  type="button"
                  onClick={() => setIsPrepareText(false)}
                  className="mt-6 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                >
                  {t('Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex flex-col"
        style={{
          backgroundColor: lightMode == 'light' ? 'white' : 'black',
          color: lightMode == 'light' ? 'black' : 'white',
          borderColor: lightMode == 'light' ? 'black' : 'white',
        }}
      >
        <div className="mb-1 w-full rounded border border-neutral-200 bg-transparent pr-2  dark:border-neutral-600 ">
          {/* <select
          ref={selectRef}
          className="w-full cursor-pointer bg-transparent p-2"
          placeholder={t('Select a plugin') || ''}
          // value={plugin?.id || ''}
          onChange={(e) => {
            console.log(e)
            // onPluginChange(
            //   PluginList.find(
            //     (plugin) => plugin.id === e.target.value,
            //   ) as Plugin,
            // );
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
        > */}
          {/* <option
            key="chatgpt"
            value="chatgpt"
            className="dark:bg-[#343541] dark:text-white"
          >
            ChatGPT
          </option> */}
          <select
            style={{
              backgroundColor: lightMode == 'light' ? 'white' : 'black',
              color: lightMode == 'light' ? 'black' : 'white',
              borderColor: lightMode == 'light' ? 'black' : 'white',
            }}
            className="w-full cursor-pointer  p-2"
            onChange={handleOptionChange}
          >
            <option
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
              }}
              value=""
            >
              Prepare AI:
            </option>
            {PluginList.map((option, index) => (
              <option
                style={{
                  backgroundColor: lightMode == 'light' ? 'white' : 'black',
                  color: lightMode == 'light' ? 'black' : 'white',
                  borderColor: lightMode == 'light' ? 'black' : 'white',
                }}
                key={index}
                value={option.id}
              >
                {option.name}
              </option>
            ))}
          </select>

          {/* {PluginList.map((plugin) => (
            
            <option
              key={plugin.id}
              value={plugin.id}
              className="dark:bg-[#343541] dark:text-white"
            >
              {plugin.name}
            </option>
          ))}
        </select> */}
        </div>
      </div>
    </>
  );
};

import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import { Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import FavIcon from '../../components/gif-white.gif';

import Modal from './Modal';
import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { SystemPrompt } from './SystemPrompt';
import { VariableModal } from './VariableModal';

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
  userChat: (chat: string) => void;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  userChat,
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      lightMode,
      showPluginSelect,
      isAutoHide,
      selectedChat,
    },
    offPluginSelect,
    onPluginSelect,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [content, setContent] = useState<string>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [prompt, setPrompt] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // const [selectedChat, setSelectedChat] = useState('');

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    homeDispatch({ field: 'selectedChat', value: selectedValue });
    userChat(selectedValue);
  };

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const handleMenus = () => {
    if (isAutoHide) {
      homeDispatch({ field: 'showChatbar', value: false });
      homeDispatch({ field: 'showPromptbar', value: false });
    }
  };
  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedConversation?.model.maxLength;

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    setContent(value);
    updatePromptListVisibility(value);
  };

  const handleSend = () => {
    if (messageIsStreaming) {
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }

    onSend(
      {
        role: 'user',
        content,
        type: selectedChat === 'Text' ? 'div' : 'image',
      },
      plugin,
    );
    setContent('');
    setPlugin(null);

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      if (showPluginSelect) offPluginSelect();
      else onPluginSelect();
      // setShowPluginSelect(!showPluginSelect);
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }

    //auto send after setting variable values
    if (messageIsStreaming) {
      return;
    }

    if (!content) {
      alert(t('Please enter a message'));
      return;
    }

    if (newContent !== undefined) {
      const message: Message = {
        role: 'user',
        content: newContent,
        type: selectedChat === 'Text' ? 'div' : 'image',
      };
      // Now you can use the message object as needed
      onSend(message, plugin);
    }
    setContent('');
    setPlugin(null);

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }
  }, [content]);

  const options = ['one', 'two', 'three'];
  const defaultOption = options[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: lightMode == 'light' ? 'white' : 'black',
        color: lightMode == 'light' ? 'black' : 'white',
        borderColor: lightMode == 'light' ? 'black' : 'white',
      }}
      className="absolute bottom-0 left-0 w-full border-transparent  from-transparent via-white to-white pt-6 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2"
    >
      {/* {showPluginSelect &&
           <Dropdown options={options}  value={defaultOption} placeholder="Select an option" />} */}
      <Modal />

      <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
        <div
          style={{
            backgroundColor: lightMode == 'light' ? 'white' : 'black',
            color: lightMode == 'light' ? 'black' : 'white',
            borderColor: lightMode == 'light' ? 'black' : 'white',
            borderRadius: 0,
            borderBottomWidth: '1px',
            borderBottomColor: 'white',
            borderBottomStyle: 'solid',
            minHeight: '5px',
          }}
          className="relative mx-2 flex w-full flex-grow flex-col rounded-md  bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4"
        >
          <button
            className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={() =>
              showPluginSelect ? offPluginSelect() : onPluginSelect()
            }
            onKeyDown={(e) => {}}
          >
            <Image
              width={20}
              style={{ background: 'transparent' }}
              height={20}
              src={lightMode == 'light' ? '/gif-black.gif' : '/gif-white.gif'}
              alt="My Image"
            />
          </button>
          {showPluginSelect && (
            <div className="absolute left-0 bottom-14 rounded bg-white dark:bg-[#343541]">
              <PluginSelect
                lightMode={lightMode}
                // plugin={plugin}
                // onKeyDown={(e: any) => {
                //   if (e.key === 'Escape') {
                //     e.preventDefault();
                //     setShowPluginSelect(false);
                //     textareaRef.current?.focus();
                //   }
                // }}
                // onPluginChange={(plugin: Plugin) => {
                //   setPlugin(plugin);
                //   setShowPluginSelect(false);

                //   if (textareaRef && textareaRef.current) {
                //     textareaRef.current.focus();
                //   }
                // }}
              />
            </div>
          )}
          <textarea
            id="promptBarInput"
            ref={textareaRef}
            onClick={() => {
              handleMenus();
              offPluginSelect();
            }}
            className="m-0 w-full resize-none border-0 bg-transparent p-0 py-2 pr-8 pl-10 text-black dark:bg-transparent dark:text-white md:py-3 md:pl-10"
            style={{
              outline: 'none',
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${
                textareaRef.current && textareaRef.current.scrollHeight > 400
                  ? 'auto'
                  : 'hidden'
              }`,
            }}
            placeholder={
              t('Type a message or type "/" to select a prompt...') || ''
            }
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          {/* Awais Added */}

          {!messageIsStreaming && (
            <select
              onChange={handleOptionChange}
              defaultValue={selectedChat}
              className="absolute right-[35px]  top-2  rounded-full p-1 bg-black  text-neutral-800   hover:text-neutral-900  dark:text-neutral-100 dark:hover:text-neutral-200"
            >
              <option
                value="Text"
                className="text-neutral-800  hover:bg-neutral-200 hover:text-neutral-900  dark:text-neutral-100 dark:hover:text-neutral-200"
              >
                Text
              </option>
              <option
                value="Image"
                className="text-neutral-800  hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-200"
              >
                Image
              </option>
            </select>
          )}

          {/* Awais Added */}
          <button
            className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={handleSend}
          >
            {messageIsStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
            ) : (
              <IconSend size={18} />
            )}
          </button>
          {showScrollDownButton && (
            <div className="absolute bottom-12 left-100 right-7 lg:bottom-1 lg:-right-6">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}
          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={(index) => {
                  setActivePromptIndex(index);
                }}
                promptListRef={promptListRef}
              />
            </div>
          )}
          {isModalVisible && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={parseVariables(
                filteredPrompts[activePromptIndex].content,
              )}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              style={{
                backgroundColor: lightMode === 'light' ? 'white' : 'black',
                color: lightMode === 'light' ? 'black' : 'white',
                width: isHovered ? '30%' : '2.5rem',
              }}
              className="relative top-y0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
              onClick={onRegenerate}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="flex items-center">
                <IconRepeat size={16} />
                {isHovered && (
                  <span className="ml-2 opacity-100 transition-opacity">
                    {t('Regenerate response')}
                  </span>
                )}
              </div>
            </button>
          )}
        {messageIsStreaming && (
          <button
            style={{
              backgroundColor: lightMode == 'light' ? 'white' : 'black',
              color: lightMode == 'light' ? 'black' : 'white',
              width: isHovered ? '30%' : '2.5rem',
            }}
            className="relative top-y0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
            onClick={handleStopConversation}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <IconPlayerStop size={16} />{' '}
            {isHovered && (
              <span className="ml-2 opacity-100 transition-opacity">
                {t('Stop generating')}
              </span>
            )}{' '}
          </button>
        )}
      </div>

      <div
        style={{
          backgroundColor: lightMode == 'light' ? 'white' : 'black',
          color: lightMode == 'light' ? 'black' : 'white',
          borderColor: lightMode == 'light' ? 'black' : 'white',
          marginTop:
            selectedConversation && selectedConversation?.messages?.length > 0
              ? 0
              : 350,
        }}
        className="px-3 pt-2 pb-3 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6"
      >
        <a
          href="https://futurum.one/data-privacy/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Data Privacy Policy
        </a>
        .{' '}
        {t(
          'Futurum One stores data on your device, is compliant with GDPR, HIPAA, SOC 2 Type 2, and CCPA, and is powered by OpenAI.',
        )}
      </div>
    </div>
  );
};

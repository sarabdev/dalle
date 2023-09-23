import { IconClearAll, IconSettings } from '@tabler/icons-react';
import React, {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';

import { AuthContext } from '@/contexts/authContext';
import { SignIn } from '@clerk/nextjs';
import axios from 'axios';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      lightMode,
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const { user, login, logout, userRole, setToken, authReady } =
    useContext(AuthContext);
  const [showSignin, setShowSignin] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toggleAction, setToggleAction] = useState('login');
  const [selectedChat, setSelectedChat] = useState('');
  const [updatechat, setupdatechat] = useState('');
  const [img, setimg] = useState('');
  const [inputValues, setInputValues] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [error, setError] = useState('');
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name;
    const value = e.target.value;
    setError('');

    setInputValues({
      ...inputValues,
      [key]: value,
    });
  };
  function test(email: string) {
    const config = {
      method: 'get',
      url: `${process.env.NEXT_PUBLIC_MANAGE_SUBSCRIPTION}?email=${email}`,
      body: {
        email,
      },
    };
    return axios(config)
      .then((response) => {
        return {
          statusCode: 200,
          body: JSON.stringify(response.data),
        };
      })
      .catch((error) => {
        return {
          statusCode: 422,
          body: `Error: ${error}`,
        };
      });
  }
  // const manage=async()=>{
  //   if(user && process.env.NEXT_PUBLIC_MANAGE_SUBSCRIPTION){
  //     const {email}=user;
  //     const response=await test(email)
  //     const result=JSON.parse(response.body);
  //     window.location.href=result?.link?.url
  //   }
  // }
  // console.log(selectedChat);
  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };

        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const endpoint = getEndpoint(plugin);

        const controller = new AbortController();
        // console.log(selectedChat.toLocaleLowerCase());
        if (selectedChat.toLocaleLowerCase() === 'image') {
          const response = await fetch('api/getImage', {
            method: 'POST',
            body: textareaRef.current?.value,
          });
          if (response.ok) {
            const result = await response.json();
            console.log(result.imgurl);
            setimg(result.imgurl);
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: result.imgurl, type: 'image' },
            ];
            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };
            console.log(updateConversation);
            console.log(updatedMessages);
            homeDispatch({
              field: 'selectedConversation',
              value: updatedConversation,
            });
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
          }
          if (!response.ok) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            toast.error(response.statusText);
            return;
          }
          const data = response.body;
          if (!data) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            return;
          }
        } else {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body,
          });
          if (!response.ok) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            toast.error(response.statusText);
            return;
          }
          const data = response.body;
          if (!data) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            return;
          }
          if (!plugin) {
            if (updatedConversation.messages.length === 1) {
              const { content } = message;
              const customName =
                content.length > 30
                  ? content.substring(0, 30) + '...'
                  : content;
              updatedConversation = {
                ...updatedConversation,
                name: customName,
              };
            }
            homeDispatch({ field: 'loading', value: false });
            const reader = data.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let isFirst = true;
            let text = '';
            while (!done) {
              if (stopConversationRef.current === true) {
                controller.abort();
                done = true;
                break;
              }
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              const chunkValue = decoder.decode(value);
              text += chunkValue;
              if (isFirst) {
                isFirst = false;
                const updatedMessages: Message[] = [
                  ...updatedConversation.messages,
                  { role: 'assistant', content: chunkValue, type: 'div' },
                ];
                updatedConversation = {
                  ...updatedConversation,
                  messages: updatedMessages,
                };
                homeDispatch({
                  field: 'selectedConversation',
                  value: updatedConversation,
                });
              } else {
                const updatedMessages: Message[] =
                  updatedConversation.messages.map((message, index) => {
                    if (index === updatedConversation.messages.length - 1) {
                      return {
                        ...message,
                        content: text,
                      };
                    }
                    return message;
                  });
                updatedConversation = {
                  ...updatedConversation,
                  messages: updatedMessages,
                };
                homeDispatch({
                  field: 'selectedConversation',
                  value: updatedConversation,
                });
              }
            }
            saveConversation(updatedConversation);
            const updatedConversations: Conversation[] = conversations.map(
              (conversation) => {
                if (conversation.id === selectedConversation.id) {
                  return updatedConversation;
                }
                return conversation;
              },
            );
            if (updatedConversations.length === 0) {
              updatedConversations.push(updatedConversation);
            }
            homeDispatch({
              field: 'conversations',
              value: updatedConversations,
            });
            saveConversations(updatedConversations);
            homeDispatch({ field: 'messageIsStreaming', value: false });
          } else {
            const { answer } = await response.json();
            const updatedMessages: Message[] = [
              ...updatedConversation.messages,
              { role: 'assistant', content: answer, type: 'div' },
            ];
            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };
            console.log(updateConversation);
            homeDispatch({
              field: 'selectedConversation',
              value: updateConversation,
            });
            saveConversation(updatedConversation);
            const updatedConversations: Conversation[] = conversations.map(
              (conversation) => {
                if (conversation.id === selectedConversation.id) {
                  return updatedConversation;
                }
                return conversation;
              },
            );
            if (updatedConversations.length === 0) {
              updatedConversations.push(updatedConversation);
            }
            homeDispatch({
              field: 'conversations',
              value: updatedConversations,
            });
            saveConversations(updatedConversations);
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
          }
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
      selectedChat,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    setLoadingResponse(true);
    const controller = new AbortController();
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        email: inputValues.email,
        password: inputValues.password,
      }),
    });
    const result = await response.json();
    setInputValues({
      username: '',
      email: '',
      password: '',
    });
    if (result.error) {
      setLoadingResponse(false);
      setError(result.message);
    } else {
      setError('');
      //setUser(result.user)
      setToken(result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', JSON.stringify(result.token));
      setLoadingResponse(false);
    }
  };

  const handleReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    setLoadingResponse(true);
    const controller = new AbortController();
    const response = await fetch('/api/passwordReset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        email: inputValues.email,
      }),
    });
    const result = await response.json();
    setInputValues({
      username: '',
      email: '',
      password: '',
    });
    if (result.error) {
      setLoadingResponse(false);
      setError(result.message);
    } else {
      setError(result.message);
      setLoadingResponse(false);
    }
  };
  const handleSignup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    setLoadingResponse(true);
    const controller = new AbortController();
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        ...inputValues,
      }),
    });
    const result = await response.json();
    setInputValues({
      username: '',
      email: '',
      password: '',
    });
    if (result.error) {
      setLoadingResponse(false);
      setError(result.message);
    } else {
      setError(result.message);
      setLoadingResponse(false);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  useEffect(() => {
    if (user) {
      homeDispatch({ field: 'apiKey', value: process.env.NEXT_PUBLIC_API_KEY });
    } else {
      homeDispatch({ field: 'apiKey', value: '' });
    }
  }, [user]);
  return (
    <>
      <div
        style={{
          backgroundColor: lightMode == 'light' ? 'white' : 'black',
          color: lightMode == 'light' ? 'black' : 'white',
          borderColor: lightMode == 'light' ? 'black' : 'white',
        }}
        className="relative flex-1 overflow-hidden bg-black dark:bg-[#343541]"
      >
        {!(apiKey || serverSideApiKeyIsSet) ? (
          <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
            <div className="text-center text-4xl font-bold text-black dark:text-white">
              Futurum One
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image
                width={100}
                style={{ background: 'transparent' }}
                height={100}
                src={lightMode == 'light' ? '/gif-black.gif' : '/gif-white.gif'}
                alt="gif"
              />
            </div>
            <div className="text-center text-lg text-black dark:text-white">
              <div className="mb-8">{`Powering the Future of Innovation`}</div>
              <div className="mb-2 font-bold">
                Embrace Futurum One, where deep AI intersects with strategic
                operations. We triumph in catalyzing efficiency, bolstering
                productivity, while preserving the human aspect.
              </div>
            </div>
            <div
              style={{
                backgroundColor: lightMode == 'light' ? 'white' : 'black',
                color: lightMode == 'light' ? 'black' : 'white',
                borderColor: lightMode == 'light' ? 'black' : 'white',
              }}
              className="text-center text-gray-500 dark:text-gray-400"
            >
              <div className="mb-2">
                We’re paving the path to the Future of Innovation, underscored
                by staunch adherence to HIPAA, SOP compliance, and stringent
                data privacy regulations.
              </div>
              <div className="mb-2">
                "Futurum One — Revolutionizing today. Shaping tomorrow."
              </div>
              {/* {user && userRole=="free" &&
            <div className=''>
            <button className='bg-gradient-to-l from-pink-500 via-blue-300 to-orange-400 text-white text-bold mt-3 bg-clip-text text-transparent text-[15px] bg-white' style={{backgroundColor:"white",padding:'10px', border:"1px solid white", borderRadius:'10px', fontWeight:'bold'}} onClick={manage}>Manage Subscription</button>
            <button className='bg-gradient-to-l from-pink-500 via-blue-300 to-orange-400 text-white text-bold mt-3 bg-clip-text text-transparent text-[15px] bg-white' style={{backgroundColor:"white",padding:'10px', border:"1px solid white", borderRadius:'10px', fontWeight:'bold'}} onClick={logout}>Logout</button>

            </div>}  */}

              {!user && (
                <div
                  className=""
                  style={{
                    backgroundColor: lightMode == 'light' ? 'white' : 'black',
                    color: lightMode == 'light' ? 'black' : 'white',
                    borderColor: lightMode == 'light' ? 'black' : 'white',
                  }}
                >
                  <button
                    style={{
                      backgroundColor: lightMode == 'light' ? 'white' : 'black',
                      color: lightMode == 'light' ? 'black' : 'white',
                      borderColor: lightMode == 'light' ? 'black' : 'white',
                      padding: '10px',
                      border: '1px solid',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                    }}
                    className="bg-gradient-to-l from-pink-500 via-blue-300 to-orange-400 text-white text-bold mt-3 bg-clip-text text-transparent text-[15px] "
                    onClick={() => setShowSignin(true)}
                  >
                    Signup / Login
                  </button>
                </div>
              )}
              {/* <div className="mb-2">
              {t(
                'Please set your OpenAI API key in the bottom left of the sidebar.',
              )}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div> */}
            </div>
          </div>
        ) : modelError ? (
          <ErrorMessageDiv error={modelError} />
        ) : (
          <>
            <div
              className="max-h-full overflow-x-hidden"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {selectedConversation?.messages.length === 0 ? (
                <>
                  {/* <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
                  <div className="text-center text-5xl font-bold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      'Futurum One'
                    )}
                  </div>

                  {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                      <ModelSelect />

                      <SystemPrompt
                        conversation={selectedConversation}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                      />

                      <TemperatureSlider
                        label={t('Communication Style')}
                        onChangeTemperature={(temperature) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'temperature',
                            value: temperature,
                          })
                        }
                      />
                    </div>
                  )}
                </div> */}
                </>
              ) : (
                <>
                  {/* <div style={{
      backgroundColor: lightMode=="light" ? "white" : "black",
      color: lightMode=="light" ? "black" : "white",
    }} className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t('Model')}: {selectedConversation?.model.name} | {t('Temp')}
                  : {selectedConversation?.temperature} |
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                </div> */}
                  {showSettings && (
                    <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                      <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                        <ModelSelect />
                      </div>
                    </div>
                  )}

                  {selectedConversation?.messages.map((message, index) => (
                    <MemoizedChatMessage
                      key={index}
                      message={message}
                      messageIndex={index}
                      onEdit={(editedMessage) => {
                        setCurrentMessage(editedMessage);
                        // discard edited message and the ones that come after then resend
                        handleSend(
                          editedMessage,
                          selectedConversation?.messages.length - index,
                        );
                      }}
                    />
                  ))}

                  {loading && <ChatLoader />}

                  <div
                    style={{
                      backgroundColor: lightMode == 'light' ? 'white' : 'black',
                      color: lightMode == 'light' ? 'black' : 'white',
                    }}
                    className="h-[162px] bg-white dark:bg-[#343541]"
                    ref={messagesEndRef}
                  />
                </>
              )}
            </div>

            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, plugin) => {
                setCurrentMessage(message);
                handleSend(message, 0, plugin);
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={() => {
                if (currentMessage) {
                  handleSend(currentMessage, 2, null);
                }
              }}
              showScrollDownButton={showScrollDownButton}
              userChat={(chat) => {
                console.log('userChat callback executed with chat:', chat);
                setSelectedChat(chat);
              }}
            />
          </>
        )}
      </div>
      {showSignin && !user && <SignIn />}
    </>
  );
});
Chat.displayName = 'Chat';

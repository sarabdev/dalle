import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useClerk } from '@clerk/clerk-react';
import {
  IconClearAll,
  IconFileExport,
  IconMist,
  IconMistOff,
  IconSettings,
  IconSettings2,
  IconVideo,
} from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { ModelSelect } from '@/components/Chat/ModelSelect';
import { SettingDialog } from '@/components/Settings/SettingDialog';

import { AuthContext } from '../../../contexts/authContext';
import { Import } from '../../Settings/Import';
import { Key } from '../../Settings/Key';
import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import DemoModal from './DemoModal';
import { PluginKeys } from './PluginKeys';

import axios from 'axios';

export const ChatbarSettings = () => {
  const { signOut } = useClerk();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { t } = useTranslation('sidebar');
  const { user, login, logout } = useContext(AuthContext);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);
  const [isOptionOpen, setIsOptionOpen] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [error, setError] = useState('');

  const {
    state: {
      apiKey,
      lightMode,
      selectedConversation,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      models,
      isAutoHide,
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
    handleApiKeyChange,
  } = useContext(ChatbarContext);

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name;
    const value = e.target.value;

    setInputValues({
      ...inputValues,
      [key]: value,
    });
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

  return (
    <>
      <div
        style={{
          borderColor: lightMode == 'light' ? 'black' : 'white',
          maxHeight: '50%',
          minHeight: isOptionOpen ? '50%' : '0%',
          overflowY: 'scroll',
          overflowX: 'hidden',
        }}
        className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm"
      >
        {isOptionOpen && (
          <>
            {/* //modal */}
            <Box
              color={lightMode === 'dark' ? 'white' : 'black'}
              bg={lightMode === 'dark' ? 'black' : 'white'}
            >
              <Modal
                blockScrollOnMount={false}
                isOpen={isOpen}
                size="full"
                onClose={onClose}
              >
                <ModalOverlay />
                <ModalContent>
                  {/* <ModalHeader
                //  bg={lightMode === 'dark' ? 'black' : 'white'}
                >
                  Demo
                </ModalHeader> */}
                  <ModalCloseButton />
                  <ModalBody>
                    <DemoModal theme={lightMode} />
                  </ModalBody>

                  {/* <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Close
                  </Button>
                </ModalFooter> */}
                </ModalContent>
              </Modal>
            </Box>
            <SidebarButton
              text={t('Demo')}
              icon={<IconVideo size={18} />}
              onClick={() => onOpen()}
              lightMode={lightMode}
            />
            {conversations.length > 0 ? (
              <ClearConversations
                onClearConversations={handleClearConversations}
                lightMode={lightMode}
              />
            ) : null}

            <Import
              onImport={handleImportConversations}
              lightMode={lightMode}
            />

            <SidebarButton
              text={t('Export data')}
              icon={<IconFileExport size={18} />}
              onClick={() => handleExportData()}
              lightMode={lightMode}
            />

            <SidebarButton
              text={t('Theme settings')}
              icon={<IconSettings2 size={18} />}
              onClick={() => setIsSettingDialog(true)}
              lightMode={lightMode}
            />
            <SidebarButton
              text={t('Delete All Messages')}
              icon={<IconClearAll size={18} />}
              onClick={() => onClearAll()}
              lightMode={lightMode}
            />

            {!serverSideApiKeyIsSet ? (
              <Key
                apiKey={process.env.NEXT_PUBLIC_API_KEY || apiKey}
                onApiKeyChange={handleApiKeyChange}
                lightMode={lightMode}
              />
            ) : null}

            {!serverSidePluginKeysSet ? <PluginKeys /> : null}
            <SidebarButton
              text={t(
                isAutoHide
                  ? 'Disable Autohide Sidebar'
                  : 'Enable Autohide Sidebar',
              )}
              icon={
                isAutoHide ? <IconMistOff size={18} /> : <IconMist size={18} />
              }
              onClick={() => {
                dispatch({ field: 'isAutoHide', value: !isAutoHide });
                localStorage.setItem('isAutoHide', JSON.stringify(!isAutoHide));
              }}
              lightMode={lightMode}
            />
            {/*user && <SidebarButton
        text={t('Change Password')}
        icon={<IconSettings2 size={18} />}
        onClick={()=>setShowPasswordReset(true)}
        lightMode={lightMode}
    />*/}
            {user && (
              <SidebarButton
                text={t('Logout')}
                icon={<IconSettings2 size={18} />}
                onClick={logout}
                lightMode={lightMode}
              />
            )}
            <SettingDialog
              open={isSettingDialogOpen}
              onClose={() => {
                setIsSettingDialog(false);
              }}
            />

            {showSettings && (
              <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                {models && models.length > 0 && (
                  <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                    <ModelSelect />
                  </div>
                )}
              </div>
            )}

            {/* {t('Temp')}
                  : {selectedConversation?.temperature} */}

            {/* <div>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                  </div> */}
          </>
        )}
      </div>
      <div
        style={{
          borderColor: lightMode == 'light' ? 'black' : 'white',
        }}
        className={
          isOptionOpen ? 'border-t border-white/20 pt-1 space-y-1' : ''
        }
      >
        <SidebarButton
          text={t('Settings')}
          icon={<IconSettings size={18} />}
          onClick={() => {
            setIsOptionOpen(!isOptionOpen);
            setShowSettings(!showSettings);
          }}
          lightMode={lightMode}
        />
      </div>

      {showPasswordReset && (
        <div
          onClick={() => setShowPasswordReset(false)}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              />

              <div
                style={{
                  backgroundColor: lightMode == 'light' ? 'white' : 'black',
                  color: lightMode == 'light' ? 'black' : 'white',
                  borderColor: lightMode == 'light' ? 'black' : 'white',
                }}
                className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
              >
                <div className="text-lg pb-4 font-bold text-center text-black dark:text-neutral-200">
                  {t('Change Password')}
                </div>
                <div className="flex justify-center">
                  <form
                    className="w-4/5"
                    style={{
                      backgroundColor: lightMode == 'light' ? 'white' : 'black',
                      color: lightMode == 'light' ? 'white' : 'black',
                      borderColor: lightMode == 'light' ? 'black' : 'white',
                    }}
                  >
                    <>
                      <label>Current Password:</label>
                      <br />
                      <input
                        required
                        minLength={6}
                        placeholder="enter current password"
                        name="oldPassword"
                        value={inputValues.oldPassword}
                        onChange={handleChange}
                        className="p-2 rounded mb-2 w-full"
                        type="password"
                      />
                      <br />
                    </>
                    <label>New Password:</label>
                    <br />
                    <input
                      required
                      minLength={2}
                      placeholder="enter new password"
                      name="newPassoword"
                      value={inputValues.newPassword}
                      onChange={handleChange}
                      className="p-2 rounded mb-2 w-full"
                      type="password"
                    />
                    <br />
                    <label>Confirm New Password:</label>
                    <br />
                    <input
                      required
                      minLength={6}
                      placeholder="confirm new password"
                      name="confirmNewPassword"
                      value={inputValues.confirmNewPassword}
                      onChange={handleChange}
                      className="p-2 rounded w-full"
                      type="password"
                    />
                    {loadingResponse && (
                      <div className="h-4 w-4 mt-5 mx-auto animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
                    )}
                    {error.length > 0 && (
                      <p
                        className="pt-3 w-full text-center"
                        style={{
                          backgroundColor:
                            lightMode == 'light' ? 'white' : 'black',
                          color: lightMode == 'light' ? 'black' : 'white',
                          borderColor: lightMode == 'light' ? 'black' : 'white',
                        }}
                      >
                        {error}
                      </p>
                    )}
                    <div className="w-full flex justify-center items-baseline">
                      <button
                        type="submit"
                        className="w-3/5 text-center px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                      >
                        {t('Change Password')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

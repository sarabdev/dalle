import {
  AspectRatio,
  Avatar,
  Box,
  BoxProps,
  Button,
  Center,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
  Icon,
  IconButton,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
// Here we have used react-icons package for the icons
import { AiOutlineHome, AiOutlineTeam } from 'react-icons/ai';
import { BsCalendarCheck, BsFolder2 } from 'react-icons/bs';
import { FiMenu } from 'react-icons/fi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiFlashlightFill } from 'react-icons/ri';

export default function DemoModal({ theme }) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <Box as="section">
      <IconButton
        aria-label="Menu"
        display={{ base: 'inline-flex', md: 'none' }}
        onClick={onOpen}
        icon={<FiMenu />}
        size="md"
      />
      <SidebarContent theme={theme} display={{ base: 'none', md: 'unset' }} />
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <SidebarContent theme={theme} w="full" borderRight="none" />
        </DrawerContent>
      </Drawer>

      <Box
        mt={{ base: 8, md: 10 }}
        ml={{ base: 0, md: 60 }}
        transition=".3s ease"
      >
        <AspectRatio
          borderWidth="2px"
          borderColor={theme === 'dark' ? 'white' : 'black'}
          overflow="hidden"
          maxW="1624px"
          maxH="800px"
          rounded="20px"
        >
          <iframe
            src="https://www.loom.com/embed/9906a144a1de4e27a141a3815be76c5c?sid=d621e90c-bc0a-43a2-b789-92e9e61c5192%22  "
            webkitallowfullscreen
            mozallowfullscreen
            allowfullscreen
          ></iframe>
        </AspectRatio>
      </Box>
    </Box>
  );
}

const SidebarContent = ({ theme, ...props }) => (
  <Box
    as="nav"
    pos="fixed"
    top="0"
    left="0"
    zIndex="sticky"
    h="full"
    // pb="10"
    overflowX="hidden"
    overflowY="auto"
    bg={theme === 'dark' ? 'black' : 'white'}
    borderColor={theme === 'dark' ? 'white' : 'black'}
    color={theme === 'dark' ? 'white' : 'black'}
    borderRightWidth="1px"
    w="60"
    {...props}
  >
    <VStack h="full" w="full" alignItems="flex-start" justify="space-between">
      <Box w="full">
        <Flex px="4" py="5" align="center">
          <Icon as={RiFlashlightFill} h={8} w={8} />
          <Text fontSize="2xl" ml="2" fontWeight="semibold">
            Tutorial
          </Text>
        </Flex>
        <Flex
          direction="column"
          as="nav"
          fontSize="md"
          aria-label="Main Navigation"
        >
          <NavItem theme={theme} icon={MdVideoLibrary}>
            Quick Guide
          </NavItem>
        </Flex>
      </Box>
    </VStack>
  </Box>
);

const NavItem = (props) => {
  const { icon, children, theme } = props;
  const background = theme === 'dark' ? '#36454F' : 'gray';

  return (
    <Flex
      align="center"
      px="4"
      py="3"
      cursor="pointer"
      role="group"
      fontWeight="semibold"
      transition=".15s ease"
      _hover={{
        bg: background,
      }}
    >
      {icon && (
        <Icon
          mx="2"
          boxSize="4"
          _groupHover={{
            color: '',
          }}
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};

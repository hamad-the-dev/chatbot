'use client'
import React, { useState, useEffect, useContext, useRef } from 'react';

import { useDropzone } from 'react-dropzone'
import { HiOutlineDotsVertical } from "react-icons/hi";
import { IoIosArrowDropdown } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { IoTrash } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { FaMicrophone } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
// import axiosPrivate from '@/app/utils/axiosPrivate';

import axiosPrivate from "../../../../utils/axiosPrivate"
import { AppContext } from '@/app/context/AppContext';
import Navbar from '@/app/components/navbar';
import { FaPlus } from "react-icons/fa6";
// import UploadProfilePicture from '@/app/components/upload';
import { io } from 'socket.io-client';


const GroupAvatar = ({ name }) => {
  const firstLetter = name?.charAt(0)?.toUpperCase() || '?';
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-sky-400', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-gray-500', 'bg-amber-500', 'bg-lime-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'];
  const colorIndex = name?.length % colors.length || 0;
  const bgColor = colors[colorIndex];
  
  return (
    <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center text-white text-xl font-semibold`}>
      {firstLetter}
    </div>
  );
};

const MemberAvatar = ({ name }) => {
  const firstLetter = name?.charAt(0)?.toUpperCase() || '?';
  
  const getColorFromName = (name) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500', 
      'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-cyan-500',
      'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500',
      'bg-amber-500', 'bg-orange-500'
    ];
    
    const hash = name?.split('')?.reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    

    return colors[Math.abs(hash) % colors.length];
  };
  
  const bgColor = getColorFromName(name);
  
  return (
    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white text-sm font-semibold shadow-md`}>
      {firstLetter}
    </div>
  );
};

const Chat = () => {
  const { userData } = useContext(AppContext);
  const messagesEndRef = useRef(null);
  const [showModal, setShowModal] = useState(false);  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [groupToRename, setGroupToRename] = useState(null);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [messagesByGroup, setMessagesByGroup] = useState({});
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMessageDropdown, setShowMessageDropdown] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesByGroup[activeGroup]]);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const response = await axiosPrivate.get('/api/groups/all-groups');
        if (response.data.success) {
        
          const groups = response?.data?.groups;
          setGroups(groups);

          const messages = {};
          groups.forEach(group => {
            messages[group?.name] = (group.messages || []).map(msg => ({
              id: msg._id,
              text: msg.text,
              sender: msg.sender?.name, timestamp: new Date(msg.timestamp).toLocaleDateString() + ' ' + new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'delivered'
            }));
          });
          setMessagesByGroup(messages);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageDropdown && !event.target.closest('.message-dropdown')) {
        setShowMessageDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMessageDropdown]);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await axiosPrivate.get('/api/user/online-users');
        if (response.data.success) {
          setMembers(response.data.users);
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (userData) {

    }
  }, [userData]);

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup) return;
    setIsSending(true);
    const groupObj = groups.find(g => g.name === activeGroup);
    const senderName = userData?.name || 'Guest (You)';
    const msgText = newMessage;
    setNewMessage('');
    // Emit message to server
    if (groupObj && socketRef.current) {
      socketRef.current.emit('sendGroupMessage', {
        groupId: groupObj._id,
        message: msgText,
        sender: senderName
      });
    }
   
    setMessagesByGroup(prev => ({
      ...prev,
      [activeGroup]: [
        ...(prev[activeGroup] || []),
        {
          id: Date.now() + Math.random(),
          text: msgText,
          sender: senderName,
          timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered'
        }
      ]
    }));
    setIsSending(false);
  };

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:4000', {
      withCredentials: true
    });

    // Listen for incoming group messages
    socketRef.current.on('receiveGroupMessage', ({ groupId, message, sender }) => {
      setMessagesByGroup(prev => {
        const groupName = groups.find(g => g._id === groupId)?.name || activeGroup;
        const newMsg = {
          id: Date.now() + Math.random(),
          text: message,
          sender: sender,
          timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered'
        };
        return {
          ...prev,
          [groupName]: [...(prev[groupName] || []), newMsg]
        };
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // Join group room when activeGroup changes
    if (activeGroup && groups.length && socketRef.current) {
      const groupObj = groups.find(g => g.name === activeGroup);
      if (groupObj) {
        socketRef.current.emit('joinGroup', groupObj._id);
      }
    }
  }, [activeGroup, groups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    try {
      const response = await axiosPrivate.post('/api/groups/create', {
        name: newGroupName,
        members: selectedUsers,
        userId: userData?._id
      });

      if (response.data.success) {
        setGroups(prev => [...prev, response.data.group]);
        setMessagesByGroup(prev => ({
          ...prev,
          [response.data.group.name]: []
        }));
        setNewGroupName('');
        setSelectedUsers([]);
        setShowModal(false);
        setActiveGroup(response.data.group.name);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  const handleRenameGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !groupToRename) return;

    try {
      const response = await axiosPrivate.put(`/api/groups/${groupToRename._id}/rename`, {
        name: newGroupName,
      });

      if (response.data.success) {
        const oldGroupName = groupToRename.name;


        setGroups(prev => prev.map(g =>
          g._id === groupToRename._id ? response.data.group : g
        ));


        setMessagesByGroup(prev => {
          const messages = { ...prev };
          if (messages[oldGroupName]) {
            messages[newGroupName] = messages[oldGroupName];
            delete messages[oldGroupName];
          }
          return messages;
        });


        if (activeGroup === oldGroupName) {
          setActiveGroup(newGroupName);
        }

        setShowRenameModal(false);
        setGroupToRename(null);
        setNewGroupName('');
      }
    } catch (error) {
      console.error('Error renaming group:', error);
      alert('Failed to rename group. Please try again.');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      try {
        const response = await axiosPrivate.delete(`/api/groups/${groupId}`);

        if (response.data.success) {
          setGroups(prev => prev.filter(g => g._id !== groupId));
          setMessagesByGroup(prev => {
            const { [groupName]: deleted, ...rest } = prev;
            return rest;
          });

          if (activeGroup === groupName) {
            const firstGroup = groups.find(g => g._id !== groupId);
            setActiveGroup(firstGroup?.name || '');
          }
        }
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };
  const handleDeleteChats = async () => {
    const currentGroup = groups.find(g => g.name === activeGroup);
    if (!currentGroup) return;

    if (window.confirm('Are you sure you want to delete all chats in this group?')) {
      try {
        const response = await axiosPrivate.delete(`/api/groups/${currentGroup._id}/messages`);
        if (response.data.success) {
          setMessagesByGroup(prev => ({
            ...prev,
            [activeGroup]: []
          }));
          alert('All messages have been deleted successfully.');
        } else {
          throw new Error(response.data.message || 'Failed to delete messages');
        }
      } catch (error) {
        console.error('Error deleting chats:', error);
        alert('Failed to delete chats. Please try again.');
      }
    }
  };

  const handleLeaveGroup = async () => {
    const currentGroup = groups.find(g => g.name === activeGroup);
    if (!currentGroup) return;

    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const response = await axiosPrivate.post(`/api/groups/${currentGroup._id}/leave`);
        if (response.data.success) {
          setGroups(prev => prev.filter(g => g._id !== currentGroup._id));
          setMessagesByGroup(prev => {
            const { [activeGroup]: deleted, ...rest } = prev;
            return rest;
          });
          setActiveGroup('');
        }
      } catch (error) {
        console.error('Error leaving group:', error);
        alert('Failed to leave group. Please try again.');
      }
    }
  };

  const handleEditMembers = async (e) => {
    e.preventDefault();
    if (!groupToEdit) return;

    try {
      const response = await axiosPrivate.put(`/api/groups/${groupToEdit._id}`, {
        name: groupToEdit.name,
        members: [...selectedMembers, userData?._id]
      });

      if (response.data.success) {
        setGroups(prev => prev.map(g =>
          g._id === groupToEdit._id ? response.data.group : g
        ));
        setShowEditMembersModal(false);
        setGroupToEdit(null);
        setSelectedMembers([]);
      }
    } catch (error) {
      console.error('Error updating group members:', error);
    }
  };

  const toggleMemberSelection = (member) => {
    if (member._id === userData?._id) return;

    setSelectedMembers(prev =>
      prev.includes(member._id)
        ? prev.filter(id => id !== member._id)
        : [...prev, member._id]
    );
  };
  const toggleUserSelection = (member) => {
    if (member._id === userData?._id) return;

    setSelectedUsers(prev =>
      prev.includes(member._id)
        ? prev.filter(id => id !== member._id)
        : [...prev, member._id]
    );
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const currentGroup = groups.find(g => g.name === activeGroup);
      if (!currentGroup) return;

      const response = await axiosPrivate.delete(`/api/groups/${currentGroup._id}/message/${messageId}`);

      if (response.data.success) {

        setMessagesByGroup(prev => ({
          ...prev,
          [activeGroup]: prev[activeGroup].filter(msg => msg.id !== messageId)
        }));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }  };

  const handleSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-us'; 

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };
  

    // const socket = io();


  return (
    <>
      <div className='border-b'>
        <Navbar />
      </div>
      <div className="flex h-screen bg-gray-100">

        <div className="w-72 bg-white border-r flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-lg">Groups</h2>
              <motion.span
                className="bg-sky-100 text-sky-600 px-2.5 py-0.5 rounded-full text-sm font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {groups.length}
              </motion.span>
            </div>

            <button

              onClick={() => setShowModal(true)}
              className="bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600 "
            >
              <span className="text-xl"><FaPlus /></span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton height={60} />
                </div>
              ))
            )
              : (
                groups.map(group => (
                  console.log('Rendering group:', group),
                  <motion.div
                    key={group._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${activeGroup === group?.name ? 'bg-sky-50 border-l-4 border-sky-500' : ''
                      } relative`}

                  >

                    <div className="flex justify-between items-start">
                      <div className="mr-3">
                        <GroupAvatar name={group?.name} />
                      </div>
                      <div
                        className="flex-1"
                        onClick={() => setActiveGroup(group?.name)}
                      >

                        <div className="font-medium text-gray-900">{group?.name}</div>

                        <div className="text-sm text-gray-500 mt-1">
                          {group.members.length}
                          members
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <div className="relative group">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-sky-500 p-1.5 rounded-full hover:bg-sky-50"
                          >
                            <FaRegEdit size={16} />
                          </motion.button>
                          <div className="hidden group-hover:block absolute right-0 mt-0 w-48 bg-white rounded-md shadow-lg z-50 border">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupToRename(group);
                                setNewGroupName(group?.name);
                                setShowRenameModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Rename Group
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupToEdit(group);
                                setSelectedMembers(group.members.filter(m => m._id !== userData?._id).map(m => m._id));
                                setShowEditMembersModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Edit Members
                            </button>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group._id, group?.name);
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50"
                        >
                          <IoTrash size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {activeGroup && <GroupAvatar name={activeGroup} />}
              <h2 className="font-semibold text-xl flex items-center gap-2">
                {activeGroup || 'Select a group'}
              </h2>
            </div>
            {activeGroup && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
                  >
                    <HiOutlineDotsVertical size={20} />
                  </motion.button>
                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border"
                      >
                        <button
                          onClick={() => {
                            handleDeleteChats();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete All Chats
                        </button>
                        {/* <button
                          onClick={() => {
                            handleLeaveGroup();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Leave Group
                        </button> */}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="w-2/3">
                    <Skeleton height={80} />
                  </div>
                </div>
              ))
            )
              : (
                messagesByGroup[activeGroup]?.map((message, index) => (                  <motion.div
                    key={`${message.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-start gap-2 ${message.sender === (userData?.name || 'Guest (You)') ? 'flex-row-reverse' : 'flex-row'
                      }`}
                  >
                    <MemberAvatar name={message.sender} />
                    <div
                      className={`max-w-[70%] rounded-lg p-3 relative group ${message.sender === (userData?.name || 'Guest (You)')
                          ? 'bg-sky-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                      <div className="text-sm font-medium mb-1 flex justify-between items-start gap-4">
                        <span>{message.sender}</span>
                        {message.sender === (userData?.name || 'Guest (You)') && (
                          <div className="relative message-dropdown">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMessageDropdown(message.id === showMessageDropdown ? null : message.id);
                              }}
                              className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-sky-600 p-1 rounded transition-all"
                            >
                              <HiOutlineDotsVertical size={16} />
                            </motion.button>
                            <AnimatePresence>
                              {showMessageDropdown === message.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-50 border"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(message.id);
                                      setShowMessageDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete Message
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      <p className="break-words">{message?.text}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <p className="text-xs text-black">
                          {message.timestamp.split(' ')[1]}
                        </p>
                        {message.sender === userData?.name && message.status === 'error' && (
                          <span className="text-xs">⚠️</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2.5 pr-24 border rounded-full focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  disabled={isSending}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-400 hover:text-sky-500"
                  >
                    <BsEmojiSmile size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSpeechRecognition}
                    className={`text-gray-400 hover:text-sky-500 ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                    title="Click to start voice input"
                  >
                    <FaMicrophone size={20} />
                  </button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                    />
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-sky-500 text-white p-2.5 rounded-full hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
              >
                <IoSend size={20} />
              </motion.button>
            </div>
          </form>
        </div>
        {/* Members List */}
        <div className="w-72 bg-white border-l flex flex-col">
          <motion.div
            className="p-4 border-b flex justify-between items-center cursor-pointer"
            onClick={() => setShowMembers(!showMembers)}
            whileHover={{ backgroundColor: "#f9fafb" }}
          >
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-lg">Members</h2>
              <motion.span
                className="bg-green-100 text-green-600 px-2.5 py-0.5 rounded-full text-sm font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {members.length}
              </motion.span>
            </div>
            <motion.div
              animate={{ rotate: showMembers ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <IoIosArrowDropdown className="text-gray-600" size={20} />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex-1 overflow-y-auto"
              >
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton height={30} />
                    </div>
                  ))
                )
                  : (
                    members.map((member) => (           
                       <motion.div
                        key={member._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 flex items-center space-x-3 hover:bg-gray-50"
                      >
                        <MemberAvatar name={member.name} />
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className={`${member._id === userData?._id ? 'text-sky-500 font-medium' : 'text-gray-700'}`}>
                          {member.name}
                          {member._id === userData?._id && " (You)"}
                        </span>
                      </motion.div>
                    ))
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>        
          <AnimatePresence>
          {showEditMembersModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Edit Group Members</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowEditMembersModal(false);
                      setGroupToEdit(null);
                      setSelectedMembers([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IoClose size={24} />
                  </motion.button>
                </div>

                <form onSubmit={handleEditMembers}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Members
                    </label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {members.map((member) => (                        <motion.div
                          key={member._id}
                          onClick={() => toggleMemberSelection(member)}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className={`p-3 cursor-pointer flex items-center space-x-3
                            ${selectedMembers.includes(member._id) ? 'bg-sky-50' : ''}
                            ${member._id === userData?._id ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <MemberAvatar name={member.name} />
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member._id)}
                            onChange={() => { }}
                            disabled={member._id === userData?._id}
                            className="h-4 w-4 text-sky-500 rounded border-gray-300 focus:ring-sky-500"
                          />
                          <span className="text-gray-700">
                            {member.name}
                            {member._id === userData?._id && " (You)"}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm text-gray-500">
                      Selected members: {selectedMembers.length}
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowEditMembersModal(false);
                        setGroupToEdit(null);
                        setSelectedMembers([]);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={selectedMembers.length === 0}
                      className="flex-1 bg-sky-500 text-white py-2.5 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
          {showRenameModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Rename Group</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowRenameModal(false);
                      setNewGroupName('');
                      setGroupToRename(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IoClose size={24} />
                  </motion.button>
                </div>

                <form onSubmit={handleRenameGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter new group name"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="w-full bg-sky-500 text-white py-2.5 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Rename Group
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Create New Group</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowModal(false);
                      setNewGroupName('');
                      setSelectedUsers([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IoClose size={24} />
                  </motion.button>
                </div>

                <form onSubmit={handleCreateGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Members
                    </label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {members.map((member) => (                        <motion.div
                          key={member._id}
                          onClick={() => toggleUserSelection(member)}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className={`p-3 cursor-pointer flex items-center space-x-3
                            ${selectedUsers.includes(member._id) ? 'bg-sky-50' : ''}
                            ${member._id === userData?._id ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <MemberAvatar name={member.name} />
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(member._id)}
                            onChange={() => { }}
                            disabled={member._id === userData?._id}
                            className="h-4 w-4 text-sky-500 rounded border-gray-300 focus:ring-sky-500"
                          />
                          <span className="text-gray-700">{member.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm text-gray-500">
                      Selected members: {selectedUsers.length}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!newGroupName.trim() || selectedUsers.length === 0}
                    className="w-full bg-sky-500 text-white py-2.5 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Group
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
};

export default Chat;

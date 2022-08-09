import {Text, View, FlatList, TextInput, Pressable} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {ChatScreenStyles as styles} from '../Styles/ChatScreenStyles';
import io from 'socket.io-client';
import {NativeStackHeaderProps} from '@react-navigation/native-stack';

type ChatScreenParams = {
  route: {
    params: {
      navigation: any;
      user: string;
    };
  };
};

type Navigation = NativeStackHeaderProps & ChatScreenParams;

export default function ChatScreen({route}: Navigation) {
  const [messageText, setMessageText] = useState('');
  const [serverMessages, setServerMessages] = useState([]);
  const serverMessagesList: Message[] = [];
  const webSocket = useRef(null);
  const [user, setUser] = useState('');

  useEffect(() => {
    setUser(route.params.user);
    webSocket.current = io(`http://192.168.111.34:3001`);
    webSocket.current.on('connect', () => {
      let str = JSON.stringify({
        type: 'Welcome',
        user: route.params.user,
        message: `${route.params.user} 님이 입장하셨습니다.`,
      });

      webSocket.current.emit('welcome', str);
      console.log('Connected Server');
    });

    webSocket.current.on('message', e => {
      let parse = JSON.parse(e);
      serverMessagesList.push(parse);
      setServerMessages([...serverMessagesList]);
    });

    webSocket.current.on('welcome', e => {
      let parse = JSON.parse(e);
      serverMessagesList.push(parse);
      setServerMessages([...serverMessagesList]);
    });

    webSocket.current.on('leave', e => {
      let parse = JSON.parse(e);
      serverMessagesList.push(parse);
      setServerMessages([...serverMessagesList]);
    });

    webSocket.current.on('error', e => {
      console.log(e.message);
    });

    webSocket.current.on('disconnect', e => {
      console.log('Disconnected. Check internet or server.');
    });

    return () => {
      let str = JSON.stringify({
        type: 'Leave',
        user: route.params.user,
        message: `${route.params.user} 님이 퇴장하셨습니다.`,
      });
      webSocket.current.emit('leave', str);
      webSocket.current.disconnect();
    };
  }, []);

  const sendMessage = () => {
    let str = JSON.stringify({type: 'Chat', user: user, message: messageText});
    webSocket.current.emit('message', str);
    setMessageText('');
  };

  return (
    <View>
      <View
        style={{
          padding: 5,
          flexGrow: 1,
        }}>
        <FlatList
          style={styles.list}
          contentContainerStyle={{paddingBottom: 50}}
          data={serverMessages}
          keyExtractor={item => item.id}
          renderItem={({item}) =>
            item.type == 'Welcome' || item.type == 'Leave' ? (
              <Text style={styles.welcomeChat}>{item.message}</Text>
            ) : item.user == user ? (
              <Text style={styles.myChat}>{item.message}</Text>
            ) : (
              <Text style={styles.otherChat}>{item.message}</Text>
            )
          }
        />
      </View>
      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.input}
          placeholder={'Add Message'}
          onChangeText={text => {
            setMessageText(text);
          }}
          value={messageText}></TextInput>
        <Pressable onPress={sendMessage} disabled={messageText == ''}>
          <Text style={styles.send}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

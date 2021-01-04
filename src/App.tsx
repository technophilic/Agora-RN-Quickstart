import requestCameraAndAudioPermission from './permission';
import React, {useEffect, useState, useRef} from 'react';
import {View, Text, TouchableOpacity, Platform} from 'react-native';
import RtcEngine, {RtcLocalView, RtcRemoteView} from 'react-native-agora';
import styles from './Style';

const App: React.FC = () => {
  const LocalView = RtcLocalView.SurfaceView;
  const RemoteView = RtcRemoteView.SurfaceView;
  let engine = useRef<RtcEngine | null>(null);

  const appid: string = 'APPID';
  const channelName: string = 'channel-x';
  const [joinSucceed, setJoinSucceed] = useState<boolean>(false);
  const [peerIds, setPeerIds] = useState<Array<number>>([]);

  useEffect(() => {
    /**
     * @name init
     * @description Function to initialize the Rtc Engine, attach event listeners and actions
     */
    async function init() {
      if (Platform.OS === 'android') {
        //Request required permissions from Android
        await requestCameraAndAudioPermission();
      }
      engine.current = await RtcEngine.create(appid);
      engine.current.enableVideo();

      engine.current.addListener('UserJoined', (uid: number) => {
        //If user joins the channel
        setPeerIds((pids) =>
          pids.indexOf(uid) === -1 ? [...pids, uid] : pids,
        ); //add peer ID to state array
      });

      engine.current.addListener('UserOffline', (uid: number) => {
        //If user leaves
        setPeerIds((pids) => pids.filter((userId) => userId !== uid)); //remove peer ID from state array
      });

      engine.current.addListener('JoinChannelSuccess', () => {
        //If Local user joins RTC channel
        setJoinSucceed(true); //Set state variable to true
      });
    }
    init();
  }, []);

  /**
   * @name startCall
   * @description Function to start the call
   */
  const startCall = () => {
    if (engine.current) {
      engine.current.joinChannel(null, channelName, null, 0); //Join Channel using null token and channel name
    }
  };

  /**
   * @name endCall
   * @description Function to end the call
   */
  const endCall = () => {
    if (engine.current) {
      engine.current.leaveChannel();
    }
    setPeerIds([]);
    setJoinSucceed(false);
  };

  return (
    <View style={styles.max}>
      {
        <View style={styles.max}>
          <View style={styles.buttonHolder}>
            <TouchableOpacity onPress={startCall} style={styles.button}>
              <Text style={styles.buttonText}> Start Call </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={endCall} style={styles.button}>
              <Text style={styles.buttonText}> End Call </Text>
            </TouchableOpacity>
          </View>
          {!joinSucceed ? (
            <View />
          ) : (
            <View style={styles.fullView}>
              {peerIds.length > 0 ? (
                peerIds.map((peerId: number) => (
                  <RemoteView
                    style={styles.half}
                    channelId={channelName}
                    uid={peerId}
                    key={peerId}
                    renderMode={1}
                  />
                ))
              ) : (
                <View>
                  <Text style={styles.noUserText}> No users connected </Text>
                </View>
              )}
              <LocalView
                style={styles.localVideoStyle} //view for local videofeed
                channelId={channelName}
                renderMode={1}
                zOrderMediaOverlay={true}
              />
            </View>
          )}
        </View>
      }
    </View>
  );
};

export default App;

import React, { Component } from 'react';
import {
    NativeModules,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    DeviceEventEmitter,
    ActivityIndicator,
    Platform
} from 'react-native';

const { ReactNativeAudioStreaming } = NativeModules;

// Possibles states
const PLAYING = 'PLAYING';
const STREAMING = 'STREAMING';
const PAUSED = 'PAUSED';
const STOPPED = 'STOPPED';
const ERROR = 'ERROR';
const METADATA_UPDATED = 'METADATA_UPDATED';
const BUFFERING = 'BUFFERING';
const START_PREPARING = 'START_PREPARING'; // Android only
const BUFFERING_START = 'BUFFERING_START'; // Android only

// UI
const iconSize = 60;

class Player extends Component {
    constructor(props) {
        super(props);
        this._onPress = this._onPress.bind(this);
        this.state = {
            status: STOPPED,
            song: ''
        };
    }

    componentDidMount() {
        this.subscription = DeviceEventEmitter.addListener(
            'AudioBridgeEvent', (evt) => {
                if (evt.status != METADATA_UPDATED) {
                    console.log('player', evt);
                }

                if (evt.status === ERROR) {
                    ReactNativeAudioStreaming.destroyNotification();
                    alert('Ups! error');
                }

                // We just want meta update for song name
                if (evt.status === METADATA_UPDATED && evt.key === 'StreamTitle') {
                    this.setState({song: evt.value});
                } else if (evt.status != METADATA_UPDATED) {
                    this.setState(evt);
                }
            }
        );

        ReactNativeAudioStreaming.getStatus((error, status) => {
            (error) ? console.log(error) : this.setState(status)
        });
    }

    componentWillUnmount() {
        this.subscription.remove();
    }

    /**
     * Al tocar el btn play/pause cambiara de estado basado en el estado actual
     */
    _onPress() {
        switch (this.state.status) {
            case PLAYING:
                /**
                 * @dengue: El plugin esta pensado para poder dar play/pause desde la notificacion,
                 * nosotros vamos a limitar el comportamiento a lo mismo que la app android, 
                 * por eso no edito el codigo de stop() para que destruya la notificacion. Ademas de que asi funcionara
                 * tambien en iOS supuestamente
                 */
                ReactNativeAudioStreaming.stop();//pause
                ReactNativeAudioStreaming.destroyNotification();
                break;
            case STREAMING:
                ReactNativeAudioStreaming.stop();//pause
                ReactNativeAudioStreaming.destroyNotification();
                break;
            case PAUSED:
                // Esto no se ejecutaria porque nunca damos pause, solo stop
                ReactNativeAudioStreaming.resume();
                break;
            case STOPPED:
                ReactNativeAudioStreaming.play(this.props.url, {showIniOSMediaCenter: true, showInAndroidNotifications: true});
                break;
            case ERROR:
                ReactNativeAudioStreaming.play(this.props.url, {showIniOSMediaCenter: true, showInAndroidNotifications: true});
                break;
            case BUFFERING:
                ReactNativeAudioStreaming.stop();
                ReactNativeAudioStreaming.destroyNotification();
                break;
        }
    }

    render() {
        let icon = null;
        switch (this.state.status) {
            case PLAYING:
            case STREAMING:
                icon = <Text style={styles.icon}>॥</Text>;
                break;
            case PAUSED:
            case STOPPED:
            case ERROR:
                icon = <Text style={styles.icon}>▸</Text>;
                break;
            case BUFFERING:
            case BUFFERING_START:
            case START_PREPARING:
                icon = <ActivityIndicator
                    animating={true}
                    style={{height: 80}}
                    size="large"
                />;
                break;
        }

        return (
            <TouchableOpacity style={styles.container} onPress={this._onPress}>
                {icon}
                <View style={styles.textContainer}>
                    <Text style={styles.songName}>{this.state.song}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        flexDirection: 'row',
        height: 80,
        paddingLeft: 10,
        paddingRight: 10,
        borderColor: '#000033',
        borderTopWidth: 1,
    },
    icon: {
        color: '#000',
        fontSize: 26,
        borderColor: '#000033',
        borderWidth: 1,
        borderRadius: iconSize / 2,
        width: iconSize,
        height: Platform.OS == 'ios' ? iconSize : 40,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: Platform.OS == 'ios' ? 10 : 0
    },
    textContainer: {
        flexDirection: 'column',
        margin: 10
    },
    textLive: {
        color: '#000',
        marginBottom: 5
    },
    songName: {
        fontSize: 20,
        textAlign: 'center',
        color: '#000'
    }
});

Player.propTypes = {
    url: React.PropTypes.string.isRequired
};

export { Player }

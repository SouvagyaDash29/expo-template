import React, { useContext, useRef, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import NetInfo from '@react-native-community/netinfo';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    StatusBar,
    Image,
    Dimensions,
    SafeAreaView,
    Animated,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Logos from "../../assets/images/Atom_walk_logo.jpg";
import Icon from 'react-native-vector-icons/Ionicons'; 
import PinPassword from '../../src/screens/PinPassword';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ErrorModal, Loader } from '../../src/components/Modals';
import { AppContext } from '../../context/AppContext';
import { colors } from '../../src/Styles/appStyle';

const { width, height } = Dimensions.get('window');


const scaleWidth = (size) => (width / 375) * size;
const scaleHeight = (size) => (height / 812) * size;

const AuthScreen = () => {
    const { login, setIsLoading, isLoading } = useContext(AppContext);
    const router = useRouter();
    const [value, setValue] = useState(''); // Single string for PIN input
    const [attemptsRemaining, setAttemptsRemaining] = useState(5);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [showPinInput, setShowPinInput] = useState(false);
    const [showFingerprint, setShowFingerprint] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showmodal, setShowModal] = useState(false);

    const shakeAnim = new Animated.Value(0);
    const maxAttempts = 5;

    const openPopup = () => {setModalVisible(true)};

      const triggerShake = () => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      };

    useEffect(() => {
        const checkBiometricOnLoad = async () => {
            const biometricEnabled = await AsyncStorage.getItem("userBiometric");
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected && biometricEnabled) {
                handleBiometricAuthentication();
            }
        };
        checkBiometricOnLoad();
    }, []);

    const checkNetworkAndAuthenticate = async () => {
        const biometricEnabled = await AsyncStorage.getItem("userBiometric");
        if (!biometricEnabled) {
            setShowModal(true)
            return;
        }

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            setIsNetworkError(true);
            return;
        }

        handleBiometricAuthentication();
    };

    const handleMPINChange = (text) => {
        setValue(text);
    };

    const handleMPINSubmit = async () => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            setIsNetworkError(true);
            return;
        }

        const correctMPIN = await AsyncStorage.getItem('userPin');
        const finalUsername = await AsyncStorage.getItem('mobileNumber');
        const userPassword = await AsyncStorage.getItem('userPin');

        if (value === correctMPIN) {
            setIsAuthenticated(true);
            login(finalUsername, userPassword);
        } else {
            const remaining = attemptsRemaining - 1;
            setAttemptsRemaining(remaining);
             if (remaining < 4 ) {
            setErrorMessage('Incorrect PIN,Try again...');
            triggerShake();
            return;
            }
            // if (remaining > 0) {
            //     // Alert.alert('Incorrect PIN', `${remaining} attempts remaining`);
            //     Alert.alert('Incorrect PIN', `Try again...`);
            // } else {
            //     Alert.alert('Account Locked', 'Too many incorrect attempts.');
            // }
        }
    };

    const handleBiometricAuthentication = async () => {
        const finalUsername = await AsyncStorage.getItem('mobileNumber');
        const userPassword = await AsyncStorage.getItem('userPin');

        try {
            const biometricAuth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to login',
                fallbackLabel: 'Use PIN instead',
            });
            if (biometricAuth.success) {
                setIsAuthenticated(true);
                login(finalUsername, userPassword);
            } else {
                Alert.alert("Authentication Failed", "Biometric authentication was not successful.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, "#feb3b3"]}
                style={styles.header}
            >
                <View style={styles.logoContainer}>
                    {Logos ? (
                        <Image source={Logos} style={styles.logo} />
                    ) : (
                        <View style={styles.companyPlaceholder}>
                            <MaterialIcons name="business" size={scaleWidth(40)} color="#fff" />
                        </View>
                    )}
                </View>
                <Text style={styles.welcomeText}>Welcome to ATOMWALK CRM</Text>
            </LinearGradient>

            <Loader visible={isLoading} message={"Please Wait..."} />

            <View style={styles.contentContainer}>
                {!showPinInput && !showFingerprint ? (
                    <View style={styles.card}>
                        <Text style={styles.loginOptionsText}>Login Options</Text>
                        <TouchableOpacity
                            style={styles.authButton}
                            onPress={() => setShowPinInput(true)}
                        >
                            <View style={styles.authButtonIconContainer}>
                                <Icon name="lock-closed-outline" size={22} color={colors.primary} />
                            </View>
                            <Text style={styles.authButtonText}>Login with PIN</Text>
                            <Icon name="chevron-forward-outline" size={20} color="#777" style={styles.authButtonArrow} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.authButton}
                            onPress={() => {
                                setShowFingerprint(true);
                                checkNetworkAndAuthenticate();
                            }}
                        >
                            <View style={styles.authButtonIconContainer}>
                                <Icon name="finger-print-outline" size={22} color={colors.primary} />
                            </View>
                            <Text style={styles.authButtonText}>Login with Fingerprint</Text>
                            <Icon name="chevron-forward-outline" size={20} color="#777" style={styles.authButtonArrow} />
                        </TouchableOpacity>
                    </View>
                ) : showPinInput ? (
                    <View style={styles.card}>
                        <Text style={styles.title}>Enter your PIN</Text>
                        <TextInput
                                style={[styles.input, { height: 50, width: '100%', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10 }]}
                                placeholder="Enter your PIN"
                                secureTextEntry
                                keyboardType="numeric"
                                maxLength={10}
                                value={value}
                                onChangeText={handleMPINChange}
                                placeholderTextColor="#888" // Ensure placeholder text is visible
                            />
                        {attemptsRemaining < maxAttempts && (
                            <View style={styles.errorContainer}>
                                <Icon name="alert-circle-outline" size={16} color="#E02020" />
                                <Text style={styles.errorText}>
                                    Incorrect PIN. {attemptsRemaining} attempts remaining.
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                value.length < 4 && {
                                    backgroundColor: '#fff',
                                    borderColor: '#4d88ff',
                                    borderWidth: 1,
                                    shadowColor: 'transparent',
                                    elevation: 0,
                                }
                            ]}
                            onPress={handleMPINSubmit}
                            disabled={value.length < 4}
                        >
                            <Text style={[
                                styles.submitButtonText,
                                value.length < 4 && { color: '#666' }
                            ]}>
                                LOGIN
                            </Text>
                        </TouchableOpacity>

                        {errorMessage ? (
                                        <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
                                          <MaterialIcons name="error-outline" size={18} color={colors.error} />
                                          <Animated.Text style={styles.errorText}>
                                            {errorMessage}
                                          </Animated.Text>
                                        </Animated.View>
                                      ) : null}

                        {/* <TouchableOpacity onPress={openPopup} style={styles.forgotContainer}>
                            <Icon name="help-circle-outline" size={16} color={colors.primary} />
                            <Text style={styles.forgotText}>Forgot PIN</Text>
                        </TouchableOpacity> */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setShowPinInput(false)}
                        >
                            <Icon name="arrow-back-outline" size={16} color={colors.primary} style={styles.backIcon} />
                            <Text style={styles.backButtonText}>Back to Login Options</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.title}>Fingerprint Authentication</Text>
                        <TouchableOpacity
                            style={styles.fingerprintIconContainer}
                            onPress={checkNetworkAndAuthenticate}
                        >
                            <Icon name="finger-print" size={80} color={colors.primary} />
                        </TouchableOpacity>

                        <Text style={styles.fingerprintHint}>
                            Place your finger on the sensor to authenticate
                        </Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => {
                                setShowFingerprint(false)
                                setShowPinInput(true);
                            }}
                        >
                            <Icon name="arrow-back-outline" size={16} color={colors.primary} style={styles.backIcon} />
                            <Text style={styles.backButtonText}>Use PIN instead</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2025 ATOMWALK. All rights reserved.</Text>
                    <Text style={styles.versionText}>Version 1.0.8</Text>
                </View>
            </View>

            <PinPassword setModalVisible={setModalVisible} modalVisible={modalVisible} />
            <ErrorModal
                visible={isNetworkError}
                message="No internet connection. Please check your network and try again."
                onClose={() => setIsNetworkError(false)}
                onRetry={checkNetworkAndAuthenticate}
            />
            <ErrorModal
                visible={showmodal}
                message="Biometric authentication is not enabled. Please enable it in settings."
                onClose={() => setShowModal(false)}></ErrorModal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingTop: 100,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderRadius: scaleWidth(10),
        overflow: 'hidden'
    },
    
    logo: {
        width: scaleWidth(150),
        height: scaleHeight(60),
        borderRadius: scaleWidth(10),
        resizeMode: 'contain',
        backgroundColor: '#fff',
    },
    
    
    logoText: {
        color: '#F37A20',
        fontSize: 16,
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    userName: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    loginOptionsText: {
        fontSize: 16,
        color: '#444',
        marginBottom: 20,
        fontWeight: '500',
        alignSelf: 'flex-start',
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        width: '100%',
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    authButtonIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    authButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    authButtonArrow: {
        marginLeft: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 25,
        color: '#333',
        textAlign: 'center',
    },
    mPINContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        width: '70%',
    },
    mPINInput: {
        width: 45,
        height: 50,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
        marginHorizontal: 5,
        backgroundColor: '#FFFFFF',
        color: '#333',
    },
    mPINInputFilled: {
        borderColor: "#feb3b3",
        backgroundColor: "#fce9e9",
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorText: {
        color: '#E02020',
        marginLeft: 5,
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: '#4d88ff',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 8,
        marginBottom: 15,
        width: '100%',
        shadowColor: '#CDADFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    forgotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    forgotText: {
        color: colors.primary,
        marginLeft: 5,
        fontWeight: '500',
    },
    fingerprintIconContainer: {
        marginVertical: 30,
        padding: 20,
        backgroundColor: "#fce9e9",
        borderRadius: 60,
    },
    fingerprintHint: {
        color: '#555',
        fontSize: 14,
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        marginRight: 5,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 15,
    },
    footerText: {
        color: '#888',
        fontSize: 12,
    },
    versionText: {
        color: '#888',
        fontSize: 12,
        marginTop: 5,
    },
    input: {
    color: colors.textPrimary,
    fontSize: 16,
    padding: 10, // Added padding for better visibility
    letterSpacing: 2, // Adds spacing between characters for PIN input
    borderWidth: 1, // Added border for visibility
    borderColor: '#ddd', // Light gray border
    borderRadius: 8, // Rounded corners
    backgroundColor: '#fff', // White background
    marginBottom:15
},
 errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: `${colors.error}15`,
    padding: 12,
    borderRadius: 8,
  },
});

export default AuthScreen;

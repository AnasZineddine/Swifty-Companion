import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";

async function saveToken(val) {
  await SecureStore.setItemAsync("userToken", val);
}

const discovery = {
  authorizationEndpoint:
    "https://api.intra.42.fr/oauth/authorize?response_type=code",
};

const Stack = createNativeStackNavigator();

const AuthContext = React.createContext();

export default function App({ navigation }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "RESTORE_TOKEN":
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case "SIGN_IN":
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case "SIGN_OUT":
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:
        "bd04f864db3a4ee1dae16cedca4d86d4fa38c5cf93674bcc4c5d3af2025f05a9",
      clientSecret:
        "615c78cb01d8c6dd540e701050da77524bb2509bb92e9bdccc5442569561bb8b",
      redirectUri: makeRedirectUri({
        scheme: "exp://10.11.6.10:19000",
      }),
      // imgur requires an empty array
      scopes: ["public"],
    },
    discovery
  );

  console.log({ response });

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await SecureStore.getItemAsync("userToken");
      } catch (e) {
        // Restoring token failed
        console.log(e);
      }

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: "RESTORE_TOKEN", token: userToken });
    };

    bootstrapAsync();

    /* if (response?.type === "success") {
      const { code } = response.params;
      const FortwyTwoAUth = async () => {
        try {
          const response = await fetch(
            `https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=bd04f864db3a4ee1dae16cedca4d86d4fa38c5cf93674bcc4c5d3af2025f05a9&client_secret=615c78cb01d8c6dd540e701050da77524bb2509bb92e9bdccc5442569561bb8b&code=${code}&redirect_uri=exp:\/\/10.11.6.10:19000`,
            {
              method: "POST",
            }
          );
          const authInfo = await response.json();
          console.log({ authInfo });
          if (authInfo.access_token) {
            console.log(authInfo.access_token);
            const response2 = await fetch(`https://api.intra.42.fr/v2/me`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authInfo.access_token}`,
              },
            });
            const userInfo = await response2.json();
            console.log({ userInfo });
          }
        } catch (error) {
          console.error(error);
        }
      };
      FortwyTwoAUth();
    } */
  }, [response]);

  const authContext = React.useMemo(
    () => ({
      signIn: async (data) => {
        console.log("nnnn");
        const { code } = response.params;
        // In a production app, we need to send some data (usually username, password) to server and get a token
        // We will also need to handle errors if sign in failed
        // After getting token, we need to persist the token using `SecureStore`
        // In the example, we'll use a dummy token
        try {
          const response = await fetch(
            `https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=bd04f864db3a4ee1dae16cedca4d86d4fa38c5cf93674bcc4c5d3af2025f05a9&client_secret=615c78cb01d8c6dd540e701050da77524bb2509bb92e9bdccc5442569561bb8b&code=${code}&redirect_uri=exp:\/\/10.11.6.10:19000`,
            {
              method: "POST",
            }
          );
          const authInfo = await response.json();
          console.log({ authInfo });
          if (authInfo.access_token) {
            saveToken(authInfo.access_token);
            console.log(authInfo.access_token);
            const response2 = await fetch(`https://api.intra.42.fr/v2/me`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authInfo.access_token}`,
              },
            });
            const userInfo = await response2.json();
            console.log({ userInfo });
          }
        } catch (error) {
          console.error(error);
        }

        dispatch({ type: "SIGN_IN", token: authInfo.access_token });
      },
      signOut: () => dispatch({ type: "SIGN_OUT" }),
    }),
    []
  );

  function LoginScreen() {
    const { signIn } = React.useContext(AuthContext);

    return (
      <View style={styles.loginButton}>
        <Button
          disabled={!request}
          title="Login"
          onPress={() => {
            promptAsync();
            signIn();
          }}
        />
      </View>
    );
  }
  function HomeScreen() {
    const { signOut } = React.useContext(AuthContext);
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Home Screen</Text>
        <Button
          title="signOut"
          onPress={() => {
            signOut();
          }}
        />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        <Stack.Navigator>
          {state.userToken == null ? (
            <Stack.Screen name="SignIn" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Home" component={HomeScreen} />
          )}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    flex: 1,
    //alignItems: "center",
    justifyContent: "center",
  },
});

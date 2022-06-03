import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";

import { Formik } from "formik";

async function saveToken(val) {
  await SecureStore.setItemAsync("userToken", val);
}
async function saveRefreshToken(val) {
  await SecureStore.setItemAsync("refreshToken", val);
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
            saveRefreshToken(authInfo.refresh_token);

            console.log(authInfo.access_token);
            console.log(authInfo.refresh_token);
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
    [response]
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
  function HomeScreen({ navigation }) {
    const { signOut } = React.useContext(AuthContext);
    const [disableButton, setDisableButton] = React.useState(false);

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Formik
          initialValues={{ username: "" }}
          onSubmit={async (values) => {
            console.log(values.username);
            const userToken = await SecureStore.getItemAsync("userToken");
            console.log({ userToken });
            const response3 = await fetch(
              `https://api.intra.42.fr/v2/users/${values.username.toLowerCase()}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${userToken}`,
                },
              }
            );
            const userInfo1 = await response3.json();
            console.log({ userInfo1 });
            if (userInfo1.message === "The access token expired") {
              const refreshToken = await SecureStore.getItemAsync(
                "refreshToken"
              );
              const response = await fetch(
                `https://api.intra.42.fr/oauth/token?grant_type=refresh_token&client_id=bd04f864db3a4ee1dae16cedca4d86d4fa38c5cf93674bcc4c5d3af2025f05a9&client_secret=615c78cb01d8c6dd540e701050da77524bb2509bb92e9bdccc5442569561bb8b&refresh_token=${refreshToken}&redirect_uri=exp:\/\/10.11.6.10:19000`,
                {
                  method: "POST",
                }
              );
              const newAuthInfo = await response.json();
              console.log({ newAuthInfo });
            }
            navigation.navigate("Profile", { userInfo1 });
            setDisableButton(false);
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values }) => (
            <View>
              <TextInput
                style={{
                  backgroundColor: "white",
                  margin: 10,
                  height: 50,
                  width: 200,
                  fontSize: 17,
                }}
                onChangeText={handleChange("username")}
                onBlur={handleBlur("username")}
                value={values.username}
                maxLength={20}
                mode="outlined"
              />
              <Button
                disabled={
                  !values.username ||
                  !/^[a-zA-Z\s-]+$/.test(values.username) ||
                  disableButton
                }
                onPress={() => {
                  handleSubmit();
                  setDisableButton(true);
                }}
                title="Search"
              />
              <Button
                title="signOut"
                onPress={() => {
                  signOut();
                }}
              />
            </View>
          )}
        </Formik>
      </View>
    );
  }
  function ProfileScreen({ route, navigation }) {
    console.log("route params", route.params);
    const {
      login,
      email,
      location,
      wallet,
      image_url,
      cursus_users,
      projects_users,
    } = route.params.userInfo1;
    console.log(cursus_users);

    if (
      !Object.keys(route.params.userInfo1).length ||
      !login ||
      !email ||
      !location ||
      !wallet ||
      !image_url ||
      !cursus_users ||
      !projects_users
    ) {
      return (
        <View>
          <Text>User not found or has not enough data</Text>
        </View>
      );
    } else
      return (
        <ScrollView>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Image
              source={{
                uri: image_url,
              }}
              style={{ width: 100, height: 100 }}
            />

            <Text>login : {login}</Text>
            <Text>email : {email}</Text>
            <Text>
              location : {location === null ? "Unavailable" : location}
            </Text>
            <Text>wallet : {wallet}</Text>
          </View>

          <View
            style={{
              flex: 2,
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
            }}
          >
            {cursus_users[2].skills.map(({ name, level, id }) => (
              <Text key={id}>
                {" "}
                {name} {level}{" "}
              </Text>
            ))}
          </View>
          <View
            style={{
              flex: 3,
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
            }}
          >
            {projects_users.map(
              ({ status, id, project }) =>
                status === "finished" && (
                  <Text key={id}>
                    {project.name} {status}
                  </Text>
                )
            )}
          </View>
        </ScrollView>
      );
  }
  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        <Stack.Navigator>
          {state.userToken == null ? (
            <Stack.Screen name="SignIn" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
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

import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import axios from "axios";

const discovery = {
  authorizationEndpoint:
    "https://api.intra.42.fr/oauth/authorize?response_type=code",
};

export default function App() {
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
    if (response?.type === "success") {
      const { code } = response.params;
      console.log("here", code);
      const FortwyTwoAUth = async () => {
        try {
          const response = await fetch(
            `https://api.intra.42.fr/oauth/token?grant_type=client_credentials&client_id=bd04f864db3a4ee1dae16cedca4d86d4fa38c5cf93674bcc4c5d3af2025f05a9&client_secret=615c78cb01d8c6dd540e701050da77524bb2509bb92e9bdccc5442569561bb8b&code=${code}`,
            {
              method: "POST",
            }
          );
          const json = await response.json();
          console.log(json);
        } catch (error) {
          console.error(error);
        }
      };
      FortwyTwoAUth();
    }
  }, [response]);

  return (
    <View style={styles.loginButton}>
      <Button
        disabled={!request}
        title="Login"
        onPress={() => {
          promptAsync();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    flex: 1,
    //alignItems: "center",
    justifyContent: "center",
  },
});

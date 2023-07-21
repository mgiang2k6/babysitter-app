import { StyleSheet } from "react-native";
import React from "react";
import { Button, HStack, StatusBar, VStack, useTheme } from "native-base";
import { ArrowRight2 } from "iconsax-react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";

const PreAuth = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  function goLogin() {
    navigation.navigate("Login");
  }
  return (
    <>
      <StatusBar barStyle="light-content" />
      <VStack flex={1}>
        <Image
          source={require("../../../assets/pre-auth.png")}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <HStack space={2} safeAreaBottom px="2" py="6">
            <Button flex={1} size="lg" rounded="lg" onPress={goLogin}>
              Tìm người trông trẻ
            </Button>
            <Button
              flex={1}
              variant="ghost"
              size="lg"
              onPress={goLogin}
              rightIcon={<ArrowRight2 color={colors.primary[600]} />}
            >
              Tôi là người trông trẻ
            </Button>
          </HStack>
        </Image>
      </VStack>
    </>
  );
};

export default PreAuth;

const styles = StyleSheet.create({});

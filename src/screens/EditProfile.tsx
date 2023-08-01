import { Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import React, { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParams, RootStackParams } from "../navigations/config";
import { useAppDispatch, useAppSelector } from "../store";
import { Button, Center, VStack, Stack, Heading, HStack, Icon } from "native-base";
import Avatar from "../components/Avatar";
import * as ImagePicker from "expo-image-picker";
import { firebaseDB, firebaseStorage } from "../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import uuid from "react-native-uuid";
import { removeLoading, setLoading } from "../store/loading.reducer";
import { EGender, EUserRole, Parrent, UserProfile } from "../types/user";
import { doc, setDoc } from "firebase/firestore";
import { setPopup } from "../store/popup.reducer";
import { EPopupType } from "../types/popup";
import { fillProfileSchema, onInputChange } from "../utils/form-utils";
import LoadingOverlay from "../components/LoadingOverlay";
import { setUser } from "../store/user.reducer";
import { Camera } from "iconsax-react-native";
import FormInput from "../components/Form/FormInput";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Entypo } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import GenderSelect from "../components/Form/GenderSelect";
import { StackScreenProps } from "@react-navigation/stack";
import { CompositeScreenProps } from "@react-navigation/native";

type Props = CompositeScreenProps<
  StackScreenProps<RootStackParams, "EditProfile">,
  StackScreenProps<AuthStackParams, "EditProfile">
>;

type ProfileForm = {
  fullname: string;
  address: string;
  age: string;
  avatar: string;
  gender: EGender;
};

const EditProfile = ({ navigation, route }: Props) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.loading);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileForm>({
    fullname: "",
    address: "",
    age: "",
    avatar: "",
    gender: EGender.None,
  });
  const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    if (!status || !status.granted) requestPermission();
  }, []);

  // TODO: Set back action to navigate SignUp
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });
    if (!result.canceled) {
      dispatch(setLoading());
      setFormData({ ...formData });
      setImage(result.assets[0].uri);
      dispatch(removeLoading());
    }
  };

  async function uploadImage(uri: string) {
    const blob: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
    const fileRef = ref(firebaseStorage, uuid.v4() as string);
    await uploadBytes(fileRef, blob);

    // We're done with the blob, close and release it
    blob.close();

    return await getDownloadURL(fileRef);
  }

  function onGoBack() {
    navigation.navigate("SignUp", { role: route.params.role });
  }

  async function onFillProfile() {
    try {
      dispatch(setLoading());
      await fillProfileSchema.validate({
        ...formData,
        age: formData.age.length ? Number(formData.age) : 0,
      });
      const avtURL = await uploadImage(image!);

      const parrentProfile: UserProfile<Parrent> = {
        phone: route.params.phone,
        password: route.params.password,
        profile: {
          address: formData.address,
          age: formData.age.length ? Number(formData.age) : 0,
          fullname: formData.fullname,
          avatar: avtURL,
          gender: formData.gender,
        },
        role: EUserRole.Parent,
      };

      await setDoc(doc(firebaseDB, "users", parrentProfile.phone), parrentProfile);
      dispatch(setUser(parrentProfile));
    } catch (err: any) {
      dispatch(removeLoading());
      dispatch(
        setPopup({
          type: EPopupType.ERROR,
          title: "Đăng ký thất bại",
          message: err.message,
        })
      );
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <StatusBar style="light" />
      <HStack bg="primary.600" safeAreaTop justifyContent="space-between" alignItems="center">
        <TouchableOpacity onPress={onGoBack} style={{ width: 30, alignItems: "center" }}>
          <Icon as={Entypo} name="chevron-left" size="lg" color="white" />
        </TouchableOpacity>
        <Heading pt="2" pb="3" color="white" fontSize="lg">
          Thiết lập tài khoản
        </Heading>
        <Stack style={{ width: 30 }} />
      </HStack>
      <KeyboardAwareScrollView style={{ flex: 1, backgroundColor: "white" }}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <VStack flex={1} bg="white" paddingX={6}>
            <Center marginBottom="6" mt="8">
              <VStack space="3">
                {!image && (
                  <Center bg="muted.100" style={styles.avtHolder}>
                    <Camera size={32} color="#525252" />
                  </Center>
                )}
                {!!image && (
                  <Avatar
                    rounded
                    source={{ uri: image }}
                    size="2xl"
                    style={{ overflow: "visible" }}
                  />
                )}
                <Button onPress={pickImage} variant="ghost">
                  Upload Avatar
                </Button>
              </VStack>
            </Center>
            <VStack justifyContent="space-between" space={3} marginBottom="8">
              <FormInput
                label="Họ và tên"
                onChangeText={onInputChange<ProfileForm>("fullname", setFormData, formData)}
              />
              <FormInput
                label="Tuổi"
                onChangeText={onInputChange<ProfileForm>("age", setFormData, formData)}
              />
              <GenderSelect
                selectedValue={formData.gender}
                onValueChange={onInputChange<ProfileForm>("gender", setFormData, formData)}
              />
              <FormInput
                label="Địa chỉ"
                onChangeText={onInputChange<ProfileForm>("address", setFormData, formData)}
              />
            </VStack>
            <Button onPress={onFillProfile}>Đăng ký</Button>
          </VStack>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  avtHolder: { width: 140, height: 140, borderRadius: 70 },
});
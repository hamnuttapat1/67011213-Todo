import { GoogleLogin } from '@react-oauth/google';

export function Google() {
    return (
        <>
            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    console.log(credentialResponse);
                }}
                onError={() => console.log("Login failed")} />
        </>
    )
}
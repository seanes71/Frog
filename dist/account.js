import {MOBILE_KEY,migrateLegacy} from './migration.js?v=mobile-1';
import {loadProfile} from './engine.js?v=starter-shop-11';
const config={apiKey:'AIzaSyCLTTGdeAKK5PILI4NHILlr0mqhSfivx0A',authDomain:'frog-match.firebaseapp.com',projectId:'frog-match',storageBucket:'frog-match.firebasestorage.app',messagingSenderId:'321187855188',appId:'1:321187855188:web:5a9766609c7bda9ccde6c1'};
const dialog=document.querySelector('#account-dialog'),message=document.querySelector('#account-message'),email=document.querySelector('#account-email'),password=document.querySelector('#account-password'),firstName=document.querySelector('#account-name'),saveNameButton=document.querySelector('#account-save-name');
let auth,db,api,user=null,timer=null,welcomeTimer=null,loading=false,cloudReady=false,session=0;
function status(text){window.frogAccountStatus=text;message.textContent=text;const target=document.querySelector('#account-status');if(target)target.textContent=text;}
function welcome(text){const el=document.querySelector('#toast');if(!el)return;clearTimeout(welcomeTimer);el.textContent=text;el.hidden=false;welcomeTimer=setTimeout(()=>el.hidden=true,3500);}
window.openFrogAccount=()=>{if(!dialog.open)dialog.showModal();if(user){if(user.displayName){status(`Hi ${user.displayName}, you're already logged in!`);welcome(`Hi ${user.displayName}, you're already logged in!`);}else{status('You are already logged in. Add your first name below.');saveNameButton.hidden=false;}}};
function errorMessage(error){const code=error?.code||'';if(code.includes('invalid-credential'))return 'Email or password is incorrect.';if(code.includes('email-already-in-use'))return 'That email already has an account. Try Log In.';if(code.includes('weak-password'))return 'Use a password with at least 6 characters.';if(code.includes('invalid-email'))return 'Enter a valid email address.';if(code.includes('unauthorized-domain'))return 'This mobile address needs to be authorized in the existing Firebase settings.';if(code.includes('operation-not-allowed'))return 'Email/password sign-in needs to be enabled in the existing Firebase account.';if(code.includes('permission-denied'))return 'Cloud save access needs to be enabled for your account.';return 'We could not connect. Your device progress is still saved. Please try again.';}
async function saveCloud(profile,key,expectedSession){if(!user||loading||!cloudReady||expectedSession!==session||key!==MOBILE_KEY+':'+user.uid)return;const uid=user.uid;try{await api.setDoc(api.doc(db,'users',uid),{frogShowdownV2:JSON.stringify(profile),frogShowdownUpdatedAt:Date.now()},{merge:true});if(expectedSession===session)status('Account connected · Cloud progress saved');}catch(error){if(expectedSession===session)status(errorMessage(error));}}
async function showUser(nextUser){
 session++;cloudReady=false;clearTimeout(timer);const current=session;user=nextUser;loading=!!user;
 document.querySelector('#account-logout').hidden=!user;
 saveNameButton.hidden=!user||!!user.displayName;
 if(!user){loading=false;document.body.classList.remove('account-loading');const local=loadProfile(localStorage.getItem(MOBILE_KEY));dispatchEvent(new CustomEvent('frog-account-profile',{detail:{key:MOBILE_KEY,profile:local}}));status('Playing on this device · Not signed in');return;}
 document.body.classList.add('account-loading');status('Loading your account progress…');const key=MOBILE_KEY+':'+user.uid;
 try{
  const snapshot=await api.getDoc(api.doc(db,'users',user.uid));if(current!==session)return;
  const data=snapshot.exists()?snapshot.data():{};const local=localStorage.getItem(key);
  const profile=data.frogShowdownV2?migrateLegacy(data):local?loadProfile(local):migrateLegacy(data);
  localStorage.setItem(key,JSON.stringify(profile));
  dispatchEvent(new CustomEvent('frog-account-profile',{detail:{key,profile}}));
  loading=false;cloudReady=true;
  if(user.displayName){if(dialog.open)dialog.close();welcome(`Hi ${user.displayName}, you're logged in!`);}
  await saveCloud(profile,key,current);
  if(current===session&&!user.displayName)status('You are signed in. Add your first name below, then choose Save First Name.');
 }catch(error){
  if(current!==session)return;
  const profile=loadProfile(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify(profile));
  dispatchEvent(new CustomEvent('frog-account-profile',{detail:{key,profile}}));status(errorMessage(error));
 }finally{if(current===session){loading=false;document.body.classList.remove('account-loading');}}
}
for(const [id,create] of [['account-login',false],['account-create',true]])document.querySelector('#'+id).addEventListener('click',async()=>{
 if(user){const greeting=user.displayName?`Hi ${user.displayName}, you're already logged in!`:'You are already logged in. Add your first name below.';status(greeting);welcome(greeting);return;}
 if(!auth){status('Account service is still connecting. Try again shortly.');return;}
 const first=firstName.value.trim();
 if(create&&!first){status('Please enter your first name to create your account.');firstName.focus();return;}
 status(create?'Creating your account…':'Logging in…');
 try{
  const credential=await (create?api.createUserWithEmailAndPassword:api.signInWithEmailAndPassword)(auth,email.value.trim(),password.value);
  if(first&&!credential.user.displayName)await api.updateProfile(credential.user,{displayName:first});
  password.value='';
  await showUser(auth.currentUser);
 }catch(error){console.error('Froggy account error:',error);status(errorMessage(error));}
});
saveNameButton.addEventListener('click',async()=>{
 const first=firstName.value.trim();
 if(!user||!first){status('Please enter your first name.');firstName.focus();return;}
 try{await api.updateProfile(user,{displayName:first});await showUser(auth.currentUser);}
 catch(error){console.error('Froggy name error:',error);status(errorMessage(error));}
});
document.querySelector('#account-close').addEventListener('click',()=>dialog.close());
document.querySelector('#account-logout').addEventListener('click',async()=>{if(!auth)return;await api.signOut(auth);password.value='';firstName.value='';});
addEventListener('frog-progress-saved',e=>{if(!user||loading)return;clearTimeout(timer);const revision=session,{key,profile}=e.detail;const snapshot=JSON.parse(JSON.stringify(profile));timer=setTimeout(()=>saveCloud(snapshot,key,revision),500);});
try{const [appSDK,authSDK,firestoreSDK]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);api={...authSDK,...firestoreSDK};const app=appSDK.initializeApp(config);auth=api.getAuth(app);db=api.getFirestore(app);api.onAuthStateChanged(auth,showUser);}catch{status('Device play is available · Account service could not connect');}
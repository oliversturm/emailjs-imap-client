'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

var _emailjsTcpSocket = require('emailjs-tcp-socket');

var _emailjsTcpSocket2 = _interopRequireDefault(_emailjsTcpSocket);

var _common = require('./common');

var _emailjsImapHandler = require('emailjs-imap-handler');

var _compression = require('./compression');

var _compression2 = _interopRequireDefault(_compression);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* babel-plugin-inline-import '../res/compression.worker.blob' */const CompressionBlob = '!function(e){var t={};function a(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,a),i.l=!0,i.exports}a.m=e,a.c=t,a.d=function(e,t,n){a.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},a.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,"a",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p="",a(a.s=12)}([function(e,t,a){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;function i(e,t){return Object.prototype.hasOwnProperty.call(e,t)}t.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var a=t.shift();if(a){if("object"!=typeof a)throw new TypeError(a+"must be non-object");for(var n in a)i(a,n)&&(e[n]=a[n])}}return e},t.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var r={arraySet:function(e,t,a,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(a,a+n),i);else for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){var t,a,n,i,r,s;for(n=0,t=0,a=e.length;t<a;t++)n+=e[t].length;for(s=new Uint8Array(n),i=0,t=0,a=e.length;t<a;t++)r=e[t],s.set(r,i),i+=r.length;return s}},s={arraySet:function(e,t,a,n,i){for(var r=0;r<n;r++)e[i+r]=t[a+r]},flattenChunks:function(e){return[].concat.apply([],e)}};t.setTyped=function(e){e?(t.Buf8=Uint8Array,t.Buf16=Uint16Array,t.Buf32=Int32Array,t.assign(t,r)):(t.Buf8=Array,t.Buf16=Array,t.Buf32=Array,t.assign(t,s))},t.setTyped(n)},function(e,t,a){"use strict";e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},function(e,t,a){"use strict";var n=function(){for(var e,t=[],a=0;a<256;a++){e=a;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[a]=e}return t}();e.exports=function(e,t,a,i){var r=n,s=i+a;e^=-1;for(var l=i;l<s;l++)e=e>>>8^r[255&(e^t[l])];return-1^e}},function(e,t,a){"use strict";e.exports=function(e,t,a,n){for(var i=65535&e|0,r=e>>>16&65535|0,s=0;0!==a;){a-=s=a>2e3?2e3:a;do{r=r+(i=i+t[n++]|0)|0}while(--s);i%=65521,r%=65521}return i|r<<16|0}},function(e,t,a){"use strict";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},function(e,t,a){"use strict";var n=a(0),i=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],r=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],s=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],l=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(e,t,a,o,h,d,_,f){var u,c,b,g,m,w,p,v,k,x=f.bits,y=0,z=0,E=0,A=0,S=0,Z=0,R=0,O=0,B=0,T=0,N=null,D=0,U=new n.Buf16(16),I=new n.Buf16(16),F=null,L=0;for(y=0;y<=15;y++)U[y]=0;for(z=0;z<o;z++)U[t[a+z]]++;for(S=x,A=15;A>=1&&0===U[A];A--);if(S>A&&(S=A),0===A)return h[d++]=20971520,h[d++]=20971520,f.bits=1,0;for(E=1;E<A&&0===U[E];E++);for(S<E&&(S=E),O=1,y=1;y<=15;y++)if(O<<=1,(O-=U[y])<0)return-1;if(O>0&&(0===e||1!==A))return-1;for(I[1]=0,y=1;y<15;y++)I[y+1]=I[y]+U[y];for(z=0;z<o;z++)0!==t[a+z]&&(_[I[t[a+z]]++]=z);if(0===e?(N=F=_,w=19):1===e?(N=i,D-=257,F=r,L-=257,w=256):(N=s,F=l,w=-1),T=0,z=0,y=E,m=d,Z=S,R=0,b=-1,g=(B=1<<S)-1,1===e&&B>852||2===e&&B>592)return 1;for(;;){p=y-R,_[z]<w?(v=0,k=_[z]):_[z]>w?(v=F[L+_[z]],k=N[D+_[z]]):(v=96,k=0),u=1<<y-R,E=c=1<<Z;do{h[m+(T>>R)+(c-=u)]=p<<24|v<<16|k|0}while(0!==c);for(u=1<<y-1;T&u;)u>>=1;if(0!==u?(T&=u-1,T+=u):T=0,z++,0==--U[y]){if(y===A)break;y=t[a+_[z]]}if(y>S&&(T&g)!==b){for(0===R&&(R=S),m+=E,O=1<<(Z=y-R);Z+R<A&&!((O-=U[Z+R])<=0);)Z++,O<<=1;if(B+=1<<Z,1===e&&B>852||2===e&&B>592)return 1;h[b=T&g]=S<<24|Z<<16|m-d|0}}return 0!==T&&(h[m+T]=y-R<<24|64<<16|0),f.bits=S,0}},function(e,t,a){"use strict";e.exports=function(e,t){var a,n,i,r,s,l,o,h,d,_,f,u,c,b,g,m,w,p,v,k,x,y,z,E,A;a=e.state,n=e.next_in,E=e.input,i=n+(e.avail_in-5),r=e.next_out,A=e.output,s=r-(t-e.avail_out),l=r+(e.avail_out-257),o=a.dmax,h=a.wsize,d=a.whave,_=a.wnext,f=a.window,u=a.hold,c=a.bits,b=a.lencode,g=a.distcode,m=(1<<a.lenbits)-1,w=(1<<a.distbits)-1;e:do{c<15&&(u+=E[n++]<<c,c+=8,u+=E[n++]<<c,c+=8),p=b[u&m];t:for(;;){if(u>>>=v=p>>>24,c-=v,0===(v=p>>>16&255))A[r++]=65535&p;else{if(!(16&v)){if(0==(64&v)){p=b[(65535&p)+(u&(1<<v)-1)];continue t}if(32&v){a.mode=12;break e}e.msg="invalid literal/length code",a.mode=30;break e}k=65535&p,(v&=15)&&(c<v&&(u+=E[n++]<<c,c+=8),k+=u&(1<<v)-1,u>>>=v,c-=v),c<15&&(u+=E[n++]<<c,c+=8,u+=E[n++]<<c,c+=8),p=g[u&w];a:for(;;){if(u>>>=v=p>>>24,c-=v,!(16&(v=p>>>16&255))){if(0==(64&v)){p=g[(65535&p)+(u&(1<<v)-1)];continue a}e.msg="invalid distance code",a.mode=30;break e}if(x=65535&p,c<(v&=15)&&(u+=E[n++]<<c,(c+=8)<v&&(u+=E[n++]<<c,c+=8)),(x+=u&(1<<v)-1)>o){e.msg="invalid distance too far back",a.mode=30;break e}if(u>>>=v,c-=v,x>(v=r-s)){if((v=x-v)>d&&a.sane){e.msg="invalid distance too far back",a.mode=30;break e}if(y=0,z=f,0===_){if(y+=h-v,v<k){k-=v;do{A[r++]=f[y++]}while(--v);y=r-x,z=A}}else if(_<v){if(y+=h+_-v,(v-=_)<k){k-=v;do{A[r++]=f[y++]}while(--v);if(y=0,_<k){k-=v=_;do{A[r++]=f[y++]}while(--v);y=r-x,z=A}}}else if(y+=_-v,v<k){k-=v;do{A[r++]=f[y++]}while(--v);y=r-x,z=A}for(;k>2;)A[r++]=z[y++],A[r++]=z[y++],A[r++]=z[y++],k-=3;k&&(A[r++]=z[y++],k>1&&(A[r++]=z[y++]))}else{y=r-x;do{A[r++]=A[y++],A[r++]=A[y++],A[r++]=A[y++],k-=3}while(k>2);k&&(A[r++]=A[y++],k>1&&(A[r++]=A[y++]))}break}}break}}while(n<i&&r<l);n-=k=c>>3,u&=(1<<(c-=k<<3))-1,e.next_in=n,e.next_out=r,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=r<l?l-r+257:257-(r-l),a.hold=u,a.bits=c}},function(e,t,a){"use strict";var n=a(0),i=a(3),r=a(2),s=a(6),l=a(5),o=0,h=1,d=2,_=4,f=5,u=6,c=0,b=1,g=2,m=-2,w=-3,p=-4,v=-5,k=8,x=1,y=2,z=3,E=4,A=5,S=6,Z=7,R=8,O=9,B=10,T=11,N=12,D=13,U=14,I=15,F=16,L=17,M=18,C=19,P=20,H=21,j=22,K=23,Y=24,G=25,X=26,W=27,q=28,J=29,Q=30,V=31,$=32,ee=852,te=592,ae=15;function ne(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function ie(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=x,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new n.Buf32(ee),t.distcode=t.distdyn=new n.Buf32(te),t.sane=1,t.back=-1,c):m}function re(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,ie(e)):m}function se(e,t){var a,n;return e&&e.state?(n=e.state,t<0?(a=0,t=-t):(a=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?m:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=a,n.wbits=t,re(e))):m}function le(e,t){var a,i;return e?(i=new function(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new n.Buf16(320),this.work=new n.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0},e.state=i,i.window=null,(a=se(e,t))!==c&&(e.state=null),a):m}var oe,he,de=!0;function _e(e){if(de){var t;for(oe=new n.Buf32(512),he=new n.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(l(h,e.lens,0,288,oe,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;l(d,e.lens,0,32,he,0,e.work,{bits:5}),de=!1}e.lencode=oe,e.lenbits=9,e.distcode=he,e.distbits=5}function fe(e,t,a,i){var r,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new n.Buf8(s.wsize)),i>=s.wsize?(n.arraySet(s.window,t,a-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):((r=s.wsize-s.wnext)>i&&(r=i),n.arraySet(s.window,t,a-i,r,s.wnext),(i-=r)?(n.arraySet(s.window,t,a-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=r,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=r))),0}t.inflateReset=re,t.inflateReset2=se,t.inflateResetKeep=ie,t.inflateInit=function(e){return le(e,ae)},t.inflateInit2=le,t.inflate=function(e,t){var a,ee,te,ae,ie,re,se,le,oe,he,de,ue,ce,be,ge,me,we,pe,ve,ke,xe,ye,ze,Ee,Ae=0,Se=new n.Buf8(4),Ze=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return m;(a=e.state).mode===N&&(a.mode=D),ie=e.next_out,te=e.output,se=e.avail_out,ae=e.next_in,ee=e.input,re=e.avail_in,le=a.hold,oe=a.bits,he=re,de=se,ye=c;e:for(;;)switch(a.mode){case x:if(0===a.wrap){a.mode=D;break}for(;oe<16;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(2&a.wrap&&35615===le){a.check=0,Se[0]=255&le,Se[1]=le>>>8&255,a.check=r(a.check,Se,2,0),le=0,oe=0,a.mode=y;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&le)<<8)+(le>>8))%31){e.msg="incorrect header check",a.mode=Q;break}if((15&le)!==k){e.msg="unknown compression method",a.mode=Q;break}if(oe-=4,xe=8+(15&(le>>>=4)),0===a.wbits)a.wbits=xe;else if(xe>a.wbits){e.msg="invalid window size",a.mode=Q;break}a.dmax=1<<xe,e.adler=a.check=1,a.mode=512&le?B:N,le=0,oe=0;break;case y:for(;oe<16;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(a.flags=le,(255&a.flags)!==k){e.msg="unknown compression method",a.mode=Q;break}if(57344&a.flags){e.msg="unknown header flags set",a.mode=Q;break}a.head&&(a.head.text=le>>8&1),512&a.flags&&(Se[0]=255&le,Se[1]=le>>>8&255,a.check=r(a.check,Se,2,0)),le=0,oe=0,a.mode=z;case z:for(;oe<32;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.head&&(a.head.time=le),512&a.flags&&(Se[0]=255&le,Se[1]=le>>>8&255,Se[2]=le>>>16&255,Se[3]=le>>>24&255,a.check=r(a.check,Se,4,0)),le=0,oe=0,a.mode=E;case E:for(;oe<16;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.head&&(a.head.xflags=255&le,a.head.os=le>>8),512&a.flags&&(Se[0]=255&le,Se[1]=le>>>8&255,a.check=r(a.check,Se,2,0)),le=0,oe=0,a.mode=A;case A:if(1024&a.flags){for(;oe<16;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.length=le,a.head&&(a.head.extra_len=le),512&a.flags&&(Se[0]=255&le,Se[1]=le>>>8&255,a.check=r(a.check,Se,2,0)),le=0,oe=0}else a.head&&(a.head.extra=null);a.mode=S;case S:if(1024&a.flags&&((ue=a.length)>re&&(ue=re),ue&&(a.head&&(xe=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),n.arraySet(a.head.extra,ee,ae,ue,xe)),512&a.flags&&(a.check=r(a.check,ee,ue,ae)),re-=ue,ae+=ue,a.length-=ue),a.length))break e;a.length=0,a.mode=Z;case Z:if(2048&a.flags){if(0===re)break e;ue=0;do{xe=ee[ae+ue++],a.head&&xe&&a.length<65536&&(a.head.name+=String.fromCharCode(xe))}while(xe&&ue<re);if(512&a.flags&&(a.check=r(a.check,ee,ue,ae)),re-=ue,ae+=ue,xe)break e}else a.head&&(a.head.name=null);a.length=0,a.mode=R;case R:if(4096&a.flags){if(0===re)break e;ue=0;do{xe=ee[ae+ue++],a.head&&xe&&a.length<65536&&(a.head.comment+=String.fromCharCode(xe))}while(xe&&ue<re);if(512&a.flags&&(a.check=r(a.check,ee,ue,ae)),re-=ue,ae+=ue,xe)break e}else a.head&&(a.head.comment=null);a.mode=O;case O:if(512&a.flags){for(;oe<16;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(le!==(65535&a.check)){e.msg="header crc mismatch",a.mode=Q;break}le=0,oe=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),e.adler=a.check=0,a.mode=N;break;case B:for(;oe<32;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}e.adler=a.check=ne(le),le=0,oe=0,a.mode=T;case T:if(0===a.havedict)return e.next_out=ie,e.avail_out=se,e.next_in=ae,e.avail_in=re,a.hold=le,a.bits=oe,g;e.adler=a.check=1,a.mode=N;case N:if(t===f||t===u)break e;case D:if(a.last){le>>>=7&oe,oe-=7&oe,a.mode=W;break}for(;oe<3;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}switch(a.last=1&le,oe-=1,3&(le>>>=1)){case 0:a.mode=U;break;case 1:if(_e(a),a.mode=P,t===u){le>>>=2,oe-=2;break e}break;case 2:a.mode=L;break;case 3:e.msg="invalid block type",a.mode=Q}le>>>=2,oe-=2;break;case U:for(le>>>=7&oe,oe-=7&oe;oe<32;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if((65535&le)!=(le>>>16^65535)){e.msg="invalid stored block lengths",a.mode=Q;break}if(a.length=65535&le,le=0,oe=0,a.mode=I,t===u)break e;case I:a.mode=F;case F:if(ue=a.length){if(ue>re&&(ue=re),ue>se&&(ue=se),0===ue)break e;n.arraySet(te,ee,ae,ue,ie),re-=ue,ae+=ue,se-=ue,ie+=ue,a.length-=ue;break}a.mode=N;break;case L:for(;oe<14;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(a.nlen=257+(31&le),le>>>=5,oe-=5,a.ndist=1+(31&le),le>>>=5,oe-=5,a.ncode=4+(15&le),le>>>=4,oe-=4,a.nlen>286||a.ndist>30){e.msg="too many length or distance symbols",a.mode=Q;break}a.have=0,a.mode=M;case M:for(;a.have<a.ncode;){for(;oe<3;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.lens[Ze[a.have++]]=7&le,le>>>=3,oe-=3}for(;a.have<19;)a.lens[Ze[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,ze={bits:a.lenbits},ye=l(o,a.lens,0,19,a.lencode,0,a.work,ze),a.lenbits=ze.bits,ye){e.msg="invalid code lengths set",a.mode=Q;break}a.have=0,a.mode=C;case C:for(;a.have<a.nlen+a.ndist;){for(;me=(Ae=a.lencode[le&(1<<a.lenbits)-1])>>>16&255,we=65535&Ae,!((ge=Ae>>>24)<=oe);){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(we<16)le>>>=ge,oe-=ge,a.lens[a.have++]=we;else{if(16===we){for(Ee=ge+2;oe<Ee;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(le>>>=ge,oe-=ge,0===a.have){e.msg="invalid bit length repeat",a.mode=Q;break}xe=a.lens[a.have-1],ue=3+(3&le),le>>>=2,oe-=2}else if(17===we){for(Ee=ge+3;oe<Ee;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}oe-=ge,xe=0,ue=3+(7&(le>>>=ge)),le>>>=3,oe-=3}else{for(Ee=ge+7;oe<Ee;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}oe-=ge,xe=0,ue=11+(127&(le>>>=ge)),le>>>=7,oe-=7}if(a.have+ue>a.nlen+a.ndist){e.msg="invalid bit length repeat",a.mode=Q;break}for(;ue--;)a.lens[a.have++]=xe}}if(a.mode===Q)break;if(0===a.lens[256]){e.msg="invalid code -- missing end-of-block",a.mode=Q;break}if(a.lenbits=9,ze={bits:a.lenbits},ye=l(h,a.lens,0,a.nlen,a.lencode,0,a.work,ze),a.lenbits=ze.bits,ye){e.msg="invalid literal/lengths set",a.mode=Q;break}if(a.distbits=6,a.distcode=a.distdyn,ze={bits:a.distbits},ye=l(d,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,ze),a.distbits=ze.bits,ye){e.msg="invalid distances set",a.mode=Q;break}if(a.mode=P,t===u)break e;case P:a.mode=H;case H:if(re>=6&&se>=258){e.next_out=ie,e.avail_out=se,e.next_in=ae,e.avail_in=re,a.hold=le,a.bits=oe,s(e,de),ie=e.next_out,te=e.output,se=e.avail_out,ae=e.next_in,ee=e.input,re=e.avail_in,le=a.hold,oe=a.bits,a.mode===N&&(a.back=-1);break}for(a.back=0;me=(Ae=a.lencode[le&(1<<a.lenbits)-1])>>>16&255,we=65535&Ae,!((ge=Ae>>>24)<=oe);){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(me&&0==(240&me)){for(pe=ge,ve=me,ke=we;me=(Ae=a.lencode[ke+((le&(1<<pe+ve)-1)>>pe)])>>>16&255,we=65535&Ae,!(pe+(ge=Ae>>>24)<=oe);){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}le>>>=pe,oe-=pe,a.back+=pe}if(le>>>=ge,oe-=ge,a.back+=ge,a.length=we,0===me){a.mode=X;break}if(32&me){a.back=-1,a.mode=N;break}if(64&me){e.msg="invalid literal/length code",a.mode=Q;break}a.extra=15&me,a.mode=j;case j:if(a.extra){for(Ee=a.extra;oe<Ee;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.length+=le&(1<<a.extra)-1,le>>>=a.extra,oe-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=K;case K:for(;me=(Ae=a.distcode[le&(1<<a.distbits)-1])>>>16&255,we=65535&Ae,!((ge=Ae>>>24)<=oe);){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(0==(240&me)){for(pe=ge,ve=me,ke=we;me=(Ae=a.distcode[ke+((le&(1<<pe+ve)-1)>>pe)])>>>16&255,we=65535&Ae,!(pe+(ge=Ae>>>24)<=oe);){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}le>>>=pe,oe-=pe,a.back+=pe}if(le>>>=ge,oe-=ge,a.back+=ge,64&me){e.msg="invalid distance code",a.mode=Q;break}a.offset=we,a.extra=15&me,a.mode=Y;case Y:if(a.extra){for(Ee=a.extra;oe<Ee;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}a.offset+=le&(1<<a.extra)-1,le>>>=a.extra,oe-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){e.msg="invalid distance too far back",a.mode=Q;break}a.mode=G;case G:if(0===se)break e;if(ue=de-se,a.offset>ue){if((ue=a.offset-ue)>a.whave&&a.sane){e.msg="invalid distance too far back",a.mode=Q;break}ue>a.wnext?(ue-=a.wnext,ce=a.wsize-ue):ce=a.wnext-ue,ue>a.length&&(ue=a.length),be=a.window}else be=te,ce=ie-a.offset,ue=a.length;ue>se&&(ue=se),se-=ue,a.length-=ue;do{te[ie++]=be[ce++]}while(--ue);0===a.length&&(a.mode=H);break;case X:if(0===se)break e;te[ie++]=a.length,se--,a.mode=H;break;case W:if(a.wrap){for(;oe<32;){if(0===re)break e;re--,le|=ee[ae++]<<oe,oe+=8}if(de-=se,e.total_out+=de,a.total+=de,de&&(e.adler=a.check=a.flags?r(a.check,te,de,ie-de):i(a.check,te,de,ie-de)),de=se,(a.flags?le:ne(le))!==a.check){e.msg="incorrect data check",a.mode=Q;break}le=0,oe=0}a.mode=q;case q:if(a.wrap&&a.flags){for(;oe<32;){if(0===re)break e;re--,le+=ee[ae++]<<oe,oe+=8}if(le!==(4294967295&a.total)){e.msg="incorrect length check",a.mode=Q;break}le=0,oe=0}a.mode=J;case J:ye=b;break e;case Q:ye=w;break e;case V:return p;case $:default:return m}return e.next_out=ie,e.avail_out=se,e.next_in=ae,e.avail_in=re,a.hold=le,a.bits=oe,(a.wsize||de!==e.avail_out&&a.mode<Q&&(a.mode<W||t!==_))&&fe(e,e.output,e.next_out,de-e.avail_out)?(a.mode=V,p):(he-=e.avail_in,de-=e.avail_out,e.total_in+=he,e.total_out+=de,a.total+=de,a.wrap&&de&&(e.adler=a.check=a.flags?r(a.check,te,de,e.next_out-de):i(a.check,te,de,e.next_out-de)),e.data_type=a.bits+(a.last?64:0)+(a.mode===N?128:0)+(a.mode===P||a.mode===I?256:0),(0===he&&0===de||t===_)&&ye===c&&(ye=v),ye)},t.inflateEnd=function(e){if(!e||!e.state)return m;var t=e.state;return t.window&&(t.window=null),e.state=null,c},t.inflateGetHeader=function(e,t){var a;return e&&e.state?0==(2&(a=e.state).wrap)?m:(a.head=t,t.done=!1,c):m},t.inflateSetDictionary=function(e,t){var a,n=t.length;return e&&e.state?0!==(a=e.state).wrap&&a.mode!==T?m:a.mode===T&&i(1,t,n,0)!==a.check?w:fe(e,t,n,n)?(a.mode=V,p):(a.havedict=1,c):m},t.inflateInfo="pako inflate (from Nodeca project)"},function(e,t,a){"use strict";var n=a(0),i=4,r=0,s=1,l=2;function o(e){for(var t=e.length;--t>=0;)e[t]=0}var h=0,d=1,_=2,f=29,u=256,c=u+1+f,b=30,g=19,m=2*c+1,w=15,p=16,v=7,k=256,x=16,y=17,z=18,E=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],A=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],S=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Z=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],R=new Array(2*(c+2));o(R);var O=new Array(2*b);o(O);var B=new Array(512);o(B);var T=new Array(256);o(T);var N=new Array(f);o(N);var D,U,I,F=new Array(b);function L(e,t,a,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=a,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function M(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function C(e){return e<256?B[e]:B[256+(e>>>7)]}function P(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function H(e,t,a){e.bi_valid>p-a?(e.bi_buf|=t<<e.bi_valid&65535,P(e,e.bi_buf),e.bi_buf=t>>p-e.bi_valid,e.bi_valid+=a-p):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=a)}function j(e,t,a){H(e,a[2*t],a[2*t+1])}function K(e,t){var a=0;do{a|=1&e,e>>>=1,a<<=1}while(--t>0);return a>>>1}function Y(e,t,a){var n,i,r=new Array(w+1),s=0;for(n=1;n<=w;n++)r[n]=s=s+a[n-1]<<1;for(i=0;i<=t;i++){var l=e[2*i+1];0!==l&&(e[2*i]=K(r[l]++,l))}}function G(e){var t;for(t=0;t<c;t++)e.dyn_ltree[2*t]=0;for(t=0;t<b;t++)e.dyn_dtree[2*t]=0;for(t=0;t<g;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*k]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function X(e){e.bi_valid>8?P(e,e.bi_buf):e.bi_valid>0&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function W(e,t,a,n){var i=2*t,r=2*a;return e[i]<e[r]||e[i]===e[r]&&n[t]<=n[a]}function q(e,t,a){for(var n=e.heap[a],i=a<<1;i<=e.heap_len&&(i<e.heap_len&&W(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!W(t,n,e.heap[i],e.depth));)e.heap[a]=e.heap[i],a=i,i<<=1;e.heap[a]=n}function J(e,t,a){var n,i,r,s,l=0;if(0!==e.last_lit)do{n=e.pending_buf[e.d_buf+2*l]<<8|e.pending_buf[e.d_buf+2*l+1],i=e.pending_buf[e.l_buf+l],l++,0===n?j(e,i,t):(j(e,(r=T[i])+u+1,t),0!==(s=E[r])&&H(e,i-=N[r],s),j(e,r=C(--n),a),0!==(s=A[r])&&H(e,n-=F[r],s))}while(l<e.last_lit);j(e,k,t)}function Q(e,t){var a,n,i,r=t.dyn_tree,s=t.stat_desc.static_tree,l=t.stat_desc.has_stree,o=t.stat_desc.elems,h=-1;for(e.heap_len=0,e.heap_max=m,a=0;a<o;a++)0!==r[2*a]?(e.heap[++e.heap_len]=h=a,e.depth[a]=0):r[2*a+1]=0;for(;e.heap_len<2;)r[2*(i=e.heap[++e.heap_len]=h<2?++h:0)]=1,e.depth[i]=0,e.opt_len--,l&&(e.static_len-=s[2*i+1]);for(t.max_code=h,a=e.heap_len>>1;a>=1;a--)q(e,r,a);i=o;do{a=e.heap[1],e.heap[1]=e.heap[e.heap_len--],q(e,r,1),n=e.heap[1],e.heap[--e.heap_max]=a,e.heap[--e.heap_max]=n,r[2*i]=r[2*a]+r[2*n],e.depth[i]=(e.depth[a]>=e.depth[n]?e.depth[a]:e.depth[n])+1,r[2*a+1]=r[2*n+1]=i,e.heap[1]=i++,q(e,r,1)}while(e.heap_len>=2);e.heap[--e.heap_max]=e.heap[1],function(e,t){var a,n,i,r,s,l,o=t.dyn_tree,h=t.max_code,d=t.stat_desc.static_tree,_=t.stat_desc.has_stree,f=t.stat_desc.extra_bits,u=t.stat_desc.extra_base,c=t.stat_desc.max_length,b=0;for(r=0;r<=w;r++)e.bl_count[r]=0;for(o[2*e.heap[e.heap_max]+1]=0,a=e.heap_max+1;a<m;a++)(r=o[2*o[2*(n=e.heap[a])+1]+1]+1)>c&&(r=c,b++),o[2*n+1]=r,n>h||(e.bl_count[r]++,s=0,n>=u&&(s=f[n-u]),l=o[2*n],e.opt_len+=l*(r+s),_&&(e.static_len+=l*(d[2*n+1]+s)));if(0!==b){do{for(r=c-1;0===e.bl_count[r];)r--;e.bl_count[r]--,e.bl_count[r+1]+=2,e.bl_count[c]--,b-=2}while(b>0);for(r=c;0!==r;r--)for(n=e.bl_count[r];0!==n;)(i=e.heap[--a])>h||(o[2*i+1]!==r&&(e.opt_len+=(r-o[2*i+1])*o[2*i],o[2*i+1]=r),n--)}}(e,t),Y(r,h,e.bl_count)}function V(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),t[2*(a+1)+1]=65535,n=0;n<=a;n++)i=s,s=t[2*(n+1)+1],++l<o&&i===s||(l<h?e.bl_tree[2*i]+=l:0!==i?(i!==r&&e.bl_tree[2*i]++,e.bl_tree[2*x]++):l<=10?e.bl_tree[2*y]++:e.bl_tree[2*z]++,l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4))}function $(e,t,a){var n,i,r=-1,s=t[1],l=0,o=7,h=4;for(0===s&&(o=138,h=3),n=0;n<=a;n++)if(i=s,s=t[2*(n+1)+1],!(++l<o&&i===s)){if(l<h)do{j(e,i,e.bl_tree)}while(0!=--l);else 0!==i?(i!==r&&(j(e,i,e.bl_tree),l--),j(e,x,e.bl_tree),H(e,l-3,2)):l<=10?(j(e,y,e.bl_tree),H(e,l-3,3)):(j(e,z,e.bl_tree),H(e,l-11,7));l=0,r=i,0===s?(o=138,h=3):i===s?(o=6,h=3):(o=7,h=4)}}o(F);var ee=!1;function te(e,t,a,i){H(e,(h<<1)+(i?1:0),3),function(e,t,a,i){X(e),i&&(P(e,a),P(e,~a)),n.arraySet(e.pending_buf,e.window,t,a,e.pending),e.pending+=a}(e,t,a,!0)}t._tr_init=function(e){ee||(function(){var e,t,a,n,i,r=new Array(w+1);for(a=0,n=0;n<f-1;n++)for(N[n]=a,e=0;e<1<<E[n];e++)T[a++]=n;for(T[a-1]=n,i=0,n=0;n<16;n++)for(F[n]=i,e=0;e<1<<A[n];e++)B[i++]=n;for(i>>=7;n<b;n++)for(F[n]=i<<7,e=0;e<1<<A[n]-7;e++)B[256+i++]=n;for(t=0;t<=w;t++)r[t]=0;for(e=0;e<=143;)R[2*e+1]=8,e++,r[8]++;for(;e<=255;)R[2*e+1]=9,e++,r[9]++;for(;e<=279;)R[2*e+1]=7,e++,r[7]++;for(;e<=287;)R[2*e+1]=8,e++,r[8]++;for(Y(R,c+1,r),e=0;e<b;e++)O[2*e+1]=5,O[2*e]=K(e,5);D=new L(R,E,u+1,c,w),U=new L(O,A,0,b,w),I=new L(new Array(0),S,0,g,v)}(),ee=!0),e.l_desc=new M(e.dyn_ltree,D),e.d_desc=new M(e.dyn_dtree,U),e.bl_desc=new M(e.bl_tree,I),e.bi_buf=0,e.bi_valid=0,G(e)},t._tr_stored_block=te,t._tr_flush_block=function(e,t,a,n){var o,h,f=0;e.level>0?(e.strm.data_type===l&&(e.strm.data_type=function(e){var t,a=4093624447;for(t=0;t<=31;t++,a>>>=1)if(1&a&&0!==e.dyn_ltree[2*t])return r;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return s;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return s;return r}(e)),Q(e,e.l_desc),Q(e,e.d_desc),f=function(e){var t;for(V(e,e.dyn_ltree,e.l_desc.max_code),V(e,e.dyn_dtree,e.d_desc.max_code),Q(e,e.bl_desc),t=g-1;t>=3&&0===e.bl_tree[2*Z[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),o=e.opt_len+3+7>>>3,(h=e.static_len+3+7>>>3)<=o&&(o=h)):o=h=a+5,a+4<=o&&-1!==t?te(e,t,a,n):e.strategy===i||h===o?(H(e,(d<<1)+(n?1:0),3),J(e,R,O)):(H(e,(_<<1)+(n?1:0),3),function(e,t,a,n){var i;for(H(e,t-257,5),H(e,a-1,5),H(e,n-4,4),i=0;i<n;i++)H(e,e.bl_tree[2*Z[i]+1],3);$(e,e.dyn_ltree,t-1),$(e,e.dyn_dtree,a-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,f+1),J(e,e.dyn_ltree,e.dyn_dtree)),G(e),n&&X(e)},t._tr_tally=function(e,t,a){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&a,e.last_lit++,0===t?e.dyn_ltree[2*a]++:(e.matches++,t--,e.dyn_ltree[2*(T[a]+u+1)]++,e.dyn_dtree[2*C(t)]++),e.last_lit===e.lit_bufsize-1},t._tr_align=function(e){H(e,d<<1,3),j(e,k,R),function(e){16===e.bi_valid?(P(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):e.bi_valid>=8&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},function(e,t,a){"use strict";var n,i=a(0),r=a(8),s=a(3),l=a(2),o=a(1),h=0,d=1,_=3,f=4,u=5,c=0,b=1,g=-2,m=-3,w=-5,p=-1,v=1,k=2,x=3,y=4,z=0,E=2,A=8,S=9,Z=15,R=8,O=286,B=30,T=19,N=2*O+1,D=15,U=3,I=258,F=I+U+1,L=32,M=42,C=69,P=73,H=91,j=103,K=113,Y=666,G=1,X=2,W=3,q=4,J=3;function Q(e,t){return e.msg=o[t],t}function V(e){return(e<<1)-(e>4?9:0)}function $(e){for(var t=e.length;--t>=0;)e[t]=0}function ee(e){var t=e.state,a=t.pending;a>e.avail_out&&(a=e.avail_out),0!==a&&(i.arraySet(e.output,t.pending_buf,t.pending_out,a,e.next_out),e.next_out+=a,t.pending_out+=a,e.total_out+=a,e.avail_out-=a,t.pending-=a,0===t.pending&&(t.pending_out=0))}function te(e,t){r._tr_flush_block(e,e.block_start>=0?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,ee(e.strm)}function ae(e,t){e.pending_buf[e.pending++]=t}function ne(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function ie(e,t,a,n){var r=e.avail_in;return r>n&&(r=n),0===r?0:(e.avail_in-=r,i.arraySet(t,e.input,e.next_in,r,a),1===e.state.wrap?e.adler=s(e.adler,t,r,a):2===e.state.wrap&&(e.adler=l(e.adler,t,r,a)),e.next_in+=r,e.total_in+=r,r)}function re(e,t){var a,n,i=e.max_chain_length,r=e.strstart,s=e.prev_length,l=e.nice_match,o=e.strstart>e.w_size-F?e.strstart-(e.w_size-F):0,h=e.window,d=e.w_mask,_=e.prev,f=e.strstart+I,u=h[r+s-1],c=h[r+s];e.prev_length>=e.good_match&&(i>>=2),l>e.lookahead&&(l=e.lookahead);do{if(h[(a=t)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<f);if(n=I-(f-r),r=f-I,n>s){if(e.match_start=t,s=n,n>=l)break;u=h[r+s-1],c=h[r+s]}}}while((t=_[t&d])>o&&0!=--i);return s<=e.lookahead?s:e.lookahead}function se(e){var t,a,n,r,s,l=e.w_size;do{if(r=e.window_size-e.lookahead-e.strstart,e.strstart>=l+(l-F)){i.arraySet(e.window,e.window,l,l,0),e.match_start-=l,e.strstart-=l,e.block_start-=l,t=a=e.hash_size;do{n=e.head[--t],e.head[t]=n>=l?n-l:0}while(--a);t=a=l;do{n=e.prev[--t],e.prev[t]=n>=l?n-l:0}while(--a);r+=l}if(0===e.strm.avail_in)break;if(a=ie(e.strm,e.window,e.strstart+e.lookahead,r),e.lookahead+=a,e.lookahead+e.insert>=U)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+U-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<U)););}while(e.lookahead<F&&0!==e.strm.avail_in)}function le(e,t){for(var a,n;;){if(e.lookahead<F){if(se(e),e.lookahead<F&&t===h)return G;if(0===e.lookahead)break}if(a=0,e.lookahead>=U&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+U-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==a&&e.strstart-a<=e.w_size-F&&(e.match_length=re(e,a)),e.match_length>=U)if(n=r._tr_tally(e,e.strstart-e.match_start,e.match_length-U),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=U){e.match_length--;do{e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+U-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart}while(0!=--e.match_length);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(te(e,!1),0===e.strm.avail_out))return G}return e.insert=e.strstart<U-1?e.strstart:U-1,t===f?(te(e,!0),0===e.strm.avail_out?W:q):e.last_lit&&(te(e,!1),0===e.strm.avail_out)?G:X}function oe(e,t){for(var a,n,i;;){if(e.lookahead<F){if(se(e),e.lookahead<F&&t===h)return G;if(0===e.lookahead)break}if(a=0,e.lookahead>=U&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+U-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=U-1,0!==a&&e.prev_length<e.max_lazy_match&&e.strstart-a<=e.w_size-F&&(e.match_length=re(e,a),e.match_length<=5&&(e.strategy===v||e.match_length===U&&e.strstart-e.match_start>4096)&&(e.match_length=U-1)),e.prev_length>=U&&e.match_length<=e.prev_length){i=e.strstart+e.lookahead-U,n=r._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-U),e.lookahead-=e.prev_length-1,e.prev_length-=2;do{++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+U-1])&e.hash_mask,a=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart)}while(0!=--e.prev_length);if(e.match_available=0,e.match_length=U-1,e.strstart++,n&&(te(e,!1),0===e.strm.avail_out))return G}else if(e.match_available){if((n=r._tr_tally(e,0,e.window[e.strstart-1]))&&te(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return G}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=r._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<U-1?e.strstart:U-1,t===f?(te(e,!0),0===e.strm.avail_out?W:q):e.last_lit&&(te(e,!1),0===e.strm.avail_out)?G:X}function he(e,t,a,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=a,this.max_chain=n,this.func=i}function de(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=E,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?M:K,e.adler=2===t.wrap?0:1,t.last_flush=h,r._tr_init(t),c):Q(e,g)}function _e(e){var t=de(e);return t===c&&function(e){e.window_size=2*e.w_size,$(e.head),e.max_lazy_match=n[e.level].max_lazy,e.good_match=n[e.level].good_length,e.nice_match=n[e.level].nice_length,e.max_chain_length=n[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=U-1,e.match_available=0,e.ins_h=0}(e.state),t}function fe(e,t,a,n,r,s){if(!e)return g;var l=1;if(t===p&&(t=6),n<0?(l=0,n=-n):n>15&&(l=2,n-=16),r<1||r>S||a!==A||n<8||n>15||t<0||t>9||s<0||s>y)return Q(e,g);8===n&&(n=9);var o=new function(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=A,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new i.Buf16(2*N),this.dyn_dtree=new i.Buf16(2*(2*B+1)),this.bl_tree=new i.Buf16(2*(2*T+1)),$(this.dyn_ltree),$(this.dyn_dtree),$(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new i.Buf16(D+1),this.heap=new i.Buf16(2*O+1),$(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new i.Buf16(2*O+1),$(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0};return e.state=o,o.strm=e,o.wrap=l,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=r+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+U-1)/U),o.window=new i.Buf8(2*o.w_size),o.head=new i.Buf16(o.hash_size),o.prev=new i.Buf16(o.w_size),o.lit_bufsize=1<<r+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new i.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=a,_e(e)}n=[new he(0,0,0,0,function(e,t){var a=65535;for(a>e.pending_buf_size-5&&(a=e.pending_buf_size-5);;){if(e.lookahead<=1){if(se(e),0===e.lookahead&&t===h)return G;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+a;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,te(e,!1),0===e.strm.avail_out))return G;if(e.strstart-e.block_start>=e.w_size-F&&(te(e,!1),0===e.strm.avail_out))return G}return e.insert=0,t===f?(te(e,!0),0===e.strm.avail_out?W:q):(e.strstart>e.block_start&&(te(e,!1),e.strm.avail_out),G)}),new he(4,4,8,4,le),new he(4,5,16,8,le),new he(4,6,32,32,le),new he(4,4,16,16,oe),new he(8,16,32,32,oe),new he(8,16,128,128,oe),new he(8,32,128,256,oe),new he(32,128,258,1024,oe),new he(32,258,258,4096,oe)],t.deflateInit=function(e,t){return fe(e,t,A,Z,R,z)},t.deflateInit2=fe,t.deflateReset=_e,t.deflateResetKeep=de,t.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?g:(e.state.gzhead=t,c):g},t.deflate=function(e,t){var a,i,s,o;if(!e||!e.state||t>u||t<0)return e?Q(e,g):g;if(i=e.state,!e.output||!e.input&&0!==e.avail_in||i.status===Y&&t!==f)return Q(e,0===e.avail_out?w:g);if(i.strm=e,a=i.last_flush,i.last_flush=t,i.status===M)if(2===i.wrap)e.adler=0,ae(i,31),ae(i,139),ae(i,8),i.gzhead?(ae(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),ae(i,255&i.gzhead.time),ae(i,i.gzhead.time>>8&255),ae(i,i.gzhead.time>>16&255),ae(i,i.gzhead.time>>24&255),ae(i,9===i.level?2:i.strategy>=k||i.level<2?4:0),ae(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(ae(i,255&i.gzhead.extra.length),ae(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(e.adler=l(e.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=C):(ae(i,0),ae(i,0),ae(i,0),ae(i,0),ae(i,0),ae(i,9===i.level?2:i.strategy>=k||i.level<2?4:0),ae(i,J),i.status=K);else{var m=A+(i.w_bits-8<<4)<<8;m|=(i.strategy>=k||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(m|=L),m+=31-m%31,i.status=K,ne(i,m),0!==i.strstart&&(ne(i,e.adler>>>16),ne(i,65535&e.adler)),e.adler=1}if(i.status===C)if(i.gzhead.extra){for(s=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),ee(e),s=i.pending,i.pending!==i.pending_buf_size));)ae(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=P)}else i.status=P;if(i.status===P)if(i.gzhead.name){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),ee(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,ae(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.gzindex=0,i.status=H)}else i.status=H;if(i.status===H)if(i.gzhead.comment){s=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),ee(e),s=i.pending,i.pending===i.pending_buf_size)){o=1;break}o=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,ae(i,o)}while(0!==o);i.gzhead.hcrc&&i.pending>s&&(e.adler=l(e.adler,i.pending_buf,i.pending-s,s)),0===o&&(i.status=j)}else i.status=j;if(i.status===j&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&ee(e),i.pending+2<=i.pending_buf_size&&(ae(i,255&e.adler),ae(i,e.adler>>8&255),e.adler=0,i.status=K)):i.status=K),0!==i.pending){if(ee(e),0===e.avail_out)return i.last_flush=-1,c}else if(0===e.avail_in&&V(t)<=V(a)&&t!==f)return Q(e,w);if(i.status===Y&&0!==e.avail_in)return Q(e,w);if(0!==e.avail_in||0!==i.lookahead||t!==h&&i.status!==Y){var p=i.strategy===k?function(e,t){for(var a;;){if(0===e.lookahead&&(se(e),0===e.lookahead)){if(t===h)return G;break}if(e.match_length=0,a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,a&&(te(e,!1),0===e.strm.avail_out))return G}return e.insert=0,t===f?(te(e,!0),0===e.strm.avail_out?W:q):e.last_lit&&(te(e,!1),0===e.strm.avail_out)?G:X}(i,t):i.strategy===x?function(e,t){for(var a,n,i,s,l=e.window;;){if(e.lookahead<=I){if(se(e),e.lookahead<=I&&t===h)return G;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=U&&e.strstart>0&&(n=l[i=e.strstart-1])===l[++i]&&n===l[++i]&&n===l[++i]){s=e.strstart+I;do{}while(n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&n===l[++i]&&i<s);e.match_length=I-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=U?(a=r._tr_tally(e,1,e.match_length-U),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(a=r._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),a&&(te(e,!1),0===e.strm.avail_out))return G}return e.insert=0,t===f?(te(e,!0),0===e.strm.avail_out?W:q):e.last_lit&&(te(e,!1),0===e.strm.avail_out)?G:X}(i,t):n[i.level].func(i,t);if(p!==W&&p!==q||(i.status=Y),p===G||p===W)return 0===e.avail_out&&(i.last_flush=-1),c;if(p===X&&(t===d?r._tr_align(i):t!==u&&(r._tr_stored_block(i,0,0,!1),t===_&&($(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),ee(e),0===e.avail_out))return i.last_flush=-1,c}return t!==f?c:i.wrap<=0?b:(2===i.wrap?(ae(i,255&e.adler),ae(i,e.adler>>8&255),ae(i,e.adler>>16&255),ae(i,e.adler>>24&255),ae(i,255&e.total_in),ae(i,e.total_in>>8&255),ae(i,e.total_in>>16&255),ae(i,e.total_in>>24&255)):(ne(i,e.adler>>>16),ne(i,65535&e.adler)),ee(e),i.wrap>0&&(i.wrap=-i.wrap),0!==i.pending?c:b)},t.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==M&&t!==C&&t!==P&&t!==H&&t!==j&&t!==K&&t!==Y?Q(e,g):(e.state=null,t===K?Q(e,m):c):g},t.deflateSetDictionary=function(e,t){var a,n,r,l,o,h,d,_,f=t.length;if(!e||!e.state)return g;if(2===(l=(a=e.state).wrap)||1===l&&a.status!==M||a.lookahead)return g;for(1===l&&(e.adler=s(e.adler,t,f,0)),a.wrap=0,f>=a.w_size&&(0===l&&($(a.head),a.strstart=0,a.block_start=0,a.insert=0),_=new i.Buf8(a.w_size),i.arraySet(_,t,f-a.w_size,a.w_size,0),t=_,f=a.w_size),o=e.avail_in,h=e.next_in,d=e.input,e.avail_in=f,e.next_in=0,e.input=t,se(a);a.lookahead>=U;){n=a.strstart,r=a.lookahead-(U-1);do{a.ins_h=(a.ins_h<<a.hash_shift^a.window[n+U-1])&a.hash_mask,a.prev[n&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=n,n++}while(--r);a.strstart=n,a.lookahead=U-1,se(a)}return a.strstart+=a.lookahead,a.block_start=a.strstart,a.insert=a.lookahead,a.lookahead=0,a.match_length=a.prev_length=U-1,a.match_available=0,e.next_in=h,e.input=d,e.avail_in=o,a.wrap=l,c},t.deflateInfo="pako deflate (from Nodeca project)"},function(e,t,a){"use strict";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=_;var n=o(a(10)),i=a(9),r=a(7),s=o(a(1)),l=a(4);function o(e){return e&&e.__esModule?e:{default:e}}var h=16384,d=15;function _(e,t){var a=this;this.inflatedReady=e,this.deflatedReady=t,this._inflate=function(e){var t=new n.default,a=(0,r.inflateInit2)(t,d);if(a!==l.Z_OK)throw new Error("Problem initializing inflate stream: "+s.default[a]);return function(a){if(void 0===a)return e();var n=void 0;t.input=a,t.next_in=0,t.avail_in=t.input.length;var i=void 0,o=void 0,d=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(h),n=t.next_out=0,t.avail_out=h),(i=(0,r.inflate)(t,l.Z_NO_FLUSH))!==l.Z_STREAM_END&&i!==l.Z_OK)throw new Error("inflate problem: "+s.default[i]);t.next_out&&(0!==t.avail_out&&i!==l.Z_STREAM_END||(o=t.output.subarray(n,n=t.next_out),d=e(o)))}while(t.avail_in>0&&i!==l.Z_STREAM_END);return t.next_out>n&&(o=t.output.subarray(n,n=t.next_out),d=e(o)),d}}(function(e){return a.inflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))}),this._deflate=function(e){var t=new n.default,a=(0,i.deflateInit2)(t,l.Z_DEFAULT_COMPRESSION,l.Z_DEFLATED,d,8,l.Z_DEFAULT_STRATEGY);if(a!==l.Z_OK)throw new Error("Problem initializing deflate stream: "+s.default[a]);return function(a){if(void 0===a)return e();t.input=a,t.next_in=0,t.avail_in=t.input.length;var n=void 0,r=void 0,o=void 0,d=!0;do{if(0===t.avail_out&&(t.output=new Uint8Array(h),o=t.next_out=0,t.avail_out=h),(n=(0,i.deflate)(t,l.Z_SYNC_FLUSH))!==l.Z_STREAM_END&&n!==l.Z_OK)throw new Error("Deflate problem: "+s.default[n]);0===t.avail_out&&t.next_out>o&&(r=t.output.subarray(o,o=t.next_out),d=e(r))}while((t.avail_in>0||0===t.avail_out)&&n!==l.Z_STREAM_END);return t.next_out>o&&(r=t.output.subarray(o,o=t.next_out),d=e(r)),d}}(function(e){return a.deflatedReady(e.buffer.slice(e.byteOffset,e.byteOffset+e.length))})}_.prototype.inflate=function(e){this._inflate(new Uint8Array(e))},_.prototype.deflate=function(e){this._deflate(new Uint8Array(e))}},function(e,t,a){"use strict";var n=function(e,t){return{message:e,buffer:t}},i=new(function(e){return e&&e.__esModule?e:{default:e}}(a(11)).default)(function(e){return self.postMessage(n("inflated_ready",e),[e])},function(e){return self.postMessage(n("deflated_ready",e),[e])});self.onmessage=function(e){var t=e.data.message,a=e.data.buffer;switch(t){case"start":break;case"inflate":i.inflate(a);break;case"deflate":i.deflate(a)}}}]);';

//
// constants used for communication with the worker
//

const MESSAGE_INITIALIZE_WORKER = 'start';
const MESSAGE_INFLATE = 'inflate';
const MESSAGE_INFLATED_DATA_READY = 'inflated_ready';
const MESSAGE_DEFLATE = 'deflate';
const MESSAGE_DEFLATED_DATA_READY = 'deflated_ready';

const EOL = '\r\n';
const LINE_FEED = 10;
const CARRIAGE_RETURN = 13;
const LEFT_CURLY_BRACKET = 123;
const RIGHT_CURLY_BRACKET = 125;

const ASCII_PLUS = 43;

// State tracking when constructing an IMAP command from buffers.
const BUFFER_STATE_LITERAL = 'literal';
const BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1 = 'literal_length_1';
const BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2 = 'literal_length_2';
const BUFFER_STATE_DEFAULT = 'default';

/**
 * How much time to wait since the last response until the connection is considered idling
 */
const TIMEOUT_ENTER_IDLE = 1000;

/**
 * Lower Bound for socket timeout to wait since the last data was written to a socket
 */
const TIMEOUT_SOCKET_LOWER_BOUND = 10000;

/**
 * Multiplier for socket timeout:
 *
 * We assume at least a GPRS connection with 115 kb/s = 14,375 kB/s tops, so 10 KB/s to be on
 * the safe side. We can timeout after a lower bound of 10s + (n KB / 10 KB/s). A 1 MB message
 * upload would be 110 seconds to wait for the timeout. 10 KB/s === 0.1 s/B
 */
const TIMEOUT_SOCKET_MULTIPLIER = 0.1;

/**
 * Creates a connection object to an IMAP server. Call `connect` method to inititate
 * the actual connection, the constructor only defines the properties but does not actually connect.
 *
 * @constructor
 *
 * @param {String} [host='localhost'] Hostname to conenct to
 * @param {Number} [port=143] Port number to connect to
 * @param {Object} [options] Optional options object
 * @param {Boolean} [options.useSecureTransport] Set to true, to use encrypted connection
 * @param {String} [options.compressionWorkerPath] offloads de-/compression computation to a web worker, this is the path to the browserified emailjs-compressor-worker.js
 */
class Imap {
  constructor(host, port, options = {}) {
    this.timeoutEnterIdle = TIMEOUT_ENTER_IDLE;
    this.timeoutSocketLowerBound = TIMEOUT_SOCKET_LOWER_BOUND;
    this.timeoutSocketMultiplier = TIMEOUT_SOCKET_MULTIPLIER;

    this.options = options;

    this.port = port || (this.options.useSecureTransport ? 993 : 143);
    this.host = host || 'localhost';

    // Use a TLS connection. Port 993 also forces TLS.
    this.options.useSecureTransport = 'useSecureTransport' in this.options ? !!this.options.useSecureTransport : this.port === 993;

    this.secureMode = !!this.options.useSecureTransport; // Does the connection use SSL/TLS

    this._connectionReady = false; // Is the conection established and greeting is received from the server

    this._globalAcceptUntagged = {}; // Global handlers for unrelated responses (EXPUNGE, EXISTS etc.)

    this._clientQueue = []; // Queue of outgoing commands
    this._canSend = false; // Is it OK to send something to the server
    this._tagCounter = 0; // Counter to allow uniqueue imap tags
    this._currentCommand = false; // Current command that is waiting for response from the server

    this._idleTimer = false; // Timer waiting to enter idle
    this._socketTimeoutTimer = false; // Timer waiting to declare the socket dead starting from the last write

    this.compressed = false; // Is the connection compressed and needs inflating/deflating

    //
    // HELPERS
    //

    // As the server sends data in chunks, it needs to be split into separate lines. Helps parsing the input.
    this._incomingBuffers = [];
    this._bufferState = BUFFER_STATE_DEFAULT;
    this._literalRemaining = 0;

    //
    // Event placeholders, may be overriden with callback functions
    //
    this.oncert = null;
    this.onerror = null; // Irrecoverable error occurred. Connection to the server will be closed automatically.
    this.onready = null; // The connection to the server has been established and greeting is received
    this.onidle = null; // There are no more commands to process
  }

  // PUBLIC METHODS

  /**
   * Initiate a connection to the server. Wait for onready event
   *
   * @param {Object} Socket
   *     TESTING ONLY! The TCPSocket has a pretty nonsensical convenience constructor,
   *     which makes it hard to mock. For dependency-injection purposes, we use the
   *     Socket parameter to pass in a mock Socket implementation. Should be left blank
   *     in production use!
   * @returns {Promise} Resolves when socket is opened
   */
  connect(Socket = _emailjsTcpSocket2.default) {
    return new Promise((resolve, reject) => {
      this.socket = Socket.open(this.host, this.port, {
        binaryType: 'arraybuffer',
        useSecureTransport: this.secureMode,
        ca: this.options.ca
      });

      // allows certificate handling for platform w/o native tls support
      // oncert is non standard so setting it might throw if the socket object is immutable
      try {
        this.socket.oncert = cert => {
          this.oncert && this.oncert(cert);
        };
      } catch (E) {}

      // Connection closing unexpected is an error
      this.socket.onclose = () => this._onError(new Error('Socket closed unexpectedly!'));
      this.socket.ondata = evt => {
        try {
          this._onData(evt);
        } catch (err) {
          this._onError(err);
        }
      };

      // if an error happens during create time, reject the promise
      this.socket.onerror = e => {
        reject(new Error('Could not open socket: ' + e.data.message));
      };

      this.socket.onopen = () => {
        // use proper "irrecoverable error, tear down everything"-handler only after socket is open
        this.socket.onerror = e => this._onError(e);
        resolve();
      };
    });
  }

  /**
   * Closes the connection to the server
   *
   * @returns {Promise} Resolves when the socket is closed
   */
  close(error) {
    return new Promise(resolve => {
      var tearDown = () => {
        // fulfill pending promises
        this._clientQueue.forEach(cmd => cmd.callback(error));
        if (this._currentCommand) {
          this._currentCommand.callback(error);
        }

        this._clientQueue = [];
        this._currentCommand = false;

        clearTimeout(this._idleTimer);
        this._idleTimer = null;

        clearTimeout(this._socketTimeoutTimer);
        this._socketTimeoutTimer = null;

        if (this.socket) {
          // remove all listeners
          this.socket.onopen = null;
          this.socket.onclose = null;
          this.socket.ondata = null;
          this.socket.onerror = null;
          try {
            this.socket.oncert = null;
          } catch (E) {}

          this.socket = null;
        }

        resolve();
      };

      this._disableCompression();

      if (!this.socket || this.socket.readyState !== 'open') {
        return tearDown();
      }

      this.socket.onclose = this.socket.onerror = tearDown; // we don't really care about the error here
      this.socket.close();
    });
  }

  /**
   * Send LOGOUT to the server.
   *
   * Use is discouraged!
   *
   * @returns {Promise} Resolves when connection is closed by server.
   */
  logout() {
    return new Promise((resolve, reject) => {
      this.socket.onclose = this.socket.onerror = () => {
        this.close('Client logging out').then(resolve).catch(reject);
      };

      this.enqueueCommand('LOGOUT');
    });
  }

  /**
   * Initiates TLS handshake
   */
  upgrade() {
    this.secureMode = true;
    this.socket.upgradeToSecure();
  }

  /**
   * Schedules a command to be sent to the server.
   * See https://github.com/emailjs/emailjs-imap-handler for request structure.
   * Do not provide a tag property, it will be set by the queue manager.
   *
   * To catch untagged responses use acceptUntagged property. For example, if
   * the value for it is 'FETCH' then the reponse includes 'payload.FETCH' property
   * that is an array including all listed * FETCH responses.
   *
   * @param {Object} request Structured request object
   * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
   * @param {Object} [options] Optional data for the command payload
   * @returns {Promise} Promise that resolves when the corresponding response was received
   */
  enqueueCommand(request, acceptUntagged, options) {
    if (typeof request === 'string') {
      request = {
        command: request
      };
    }

    acceptUntagged = [].concat(acceptUntagged || []).map(untagged => (untagged || '').toString().toUpperCase().trim());

    var tag = 'W' + ++this._tagCounter;
    request.tag = tag;

    return new Promise((resolve, reject) => {
      var data = {
        tag: tag,
        request: request,
        payload: acceptUntagged.length ? {} : undefined,
        callback: response => {
          if (this.isError(response)) {
            return reject(response);
          } else if (['NO', 'BAD'].indexOf((0, _ramda.propOr)('', 'command', response).toUpperCase().trim()) >= 0) {
            var error = new Error(response.humanReadable || 'Error');
            if (response.code) {
              error.code = response.code;
            }
            return reject(error);
          }

          resolve(response);
        }

        // apply any additional options to the command
      };Object.keys(options || {}).forEach(key => {
        data[key] = options[key];
      });

      acceptUntagged.forEach(command => {
        data.payload[command] = [];
      });

      // if we're in priority mode (i.e. we ran commands in a precheck),
      // queue any commands BEFORE the command that contianed the precheck,
      // otherwise just queue command as usual
      var index = data.ctx ? this._clientQueue.indexOf(data.ctx) : -1;
      if (index >= 0) {
        data.tag += '.p';
        data.request.tag += '.p';
        this._clientQueue.splice(index, 0, data);
      } else {
        this._clientQueue.push(data);
      }

      if (this._canSend) {
        this._sendRequest();
      }
    });
  }

  /**
   *
   * @param commands
   * @param ctx
   * @returns {*}
   */
  getPreviouslyQueued(commands, ctx) {
    const startIndex = this._clientQueue.indexOf(ctx) - 1;

    // search backwards for the commands and return the first found
    for (let i = startIndex; i >= 0; i--) {
      if (isMatch(this._clientQueue[i])) {
        return this._clientQueue[i];
      }
    }

    // also check current command if no SELECT is queued
    if (isMatch(this._currentCommand)) {
      return this._currentCommand;
    }

    return false;

    function isMatch(data) {
      return data && data.request && commands.indexOf(data.request.command) >= 0;
    }
  }

  /**
   * Send data to the TCP socket
   * Arms a timeout waiting for a response from the server.
   *
   * @param {String} str Payload
   */
  send(str) {
    const buffer = (0, _common.toTypedArray)(str).buffer;
    const timeout = this.timeoutSocketLowerBound + Math.floor(buffer.byteLength * this.timeoutSocketMultiplier);

    clearTimeout(this._socketTimeoutTimer); // clear pending timeouts
    this._socketTimeoutTimer = setTimeout(() => this._onError(new Error(' Socket timed out!')), timeout); // arm the next timeout

    if (this.compressed) {
      this._sendCompressed(buffer);
    } else {
      this.socket.send(buffer);
    }
  }

  /**
   * Set a global handler for an untagged response. If currently processed command
   * has not listed untagged command it is forwarded to the global handler. Useful
   * with EXPUNGE, EXISTS etc.
   *
   * @param {String} command Untagged command name
   * @param {Function} callback Callback function with response object and continue callback function
   */
  setHandler(command, callback) {
    this._globalAcceptUntagged[command.toUpperCase().trim()] = callback;
  }

  // INTERNAL EVENTS

  /**
   * Error handler for the socket
   *
   * @event
   * @param {Event} evt Event object. See evt.data for the error
   */
  _onError(evt) {
    var error;
    if (this.isError(evt)) {
      error = evt;
    } else if (evt && this.isError(evt.data)) {
      error = evt.data;
    } else {
      error = new Error(evt && evt.data && evt.data.message || evt.data || evt || 'Error');
    }

    this.logger.error(error);

    // always call onerror callback, no matter if close() succeeds or fails
    this.close(error).then(() => {
      this.onerror && this.onerror(error);
    }, () => {
      this.onerror && this.onerror(error);
    });
  }

  /**
   * Handler for incoming data from the server. The data is sent in arbitrary
   * chunks and can't be used directly so this function makes sure the data
   * is split into complete lines before the data is passed to the command
   * handler
   *
   * @param {Event} evt
   */
  _onData(evt) {
    clearTimeout(this._socketTimeoutTimer); // reset the timeout on each data packet
    const timeout = this.timeoutSocketLowerBound + Math.floor(4096 * this.timeoutSocketMultiplier); // max packet size is 4096 bytes
    this._socketTimeoutTimer = setTimeout(() => this._onError(new Error(' Socket timed out!')), timeout);

    this._incomingBuffers.push(new Uint8Array(evt.data)); // append to the incoming buffer
    this._parseIncomingCommands(this._iterateIncomingBuffer()); // Consume the incoming buffer
  }

  *_iterateIncomingBuffer() {
    let buf = this._incomingBuffers[this._incomingBuffers.length - 1] || [];
    let i = 0;

    // loop invariant:
    //   this._incomingBuffers starts with the beginning of incoming command.
    //   buf is shorthand for last element of this._incomingBuffers.
    //   buf[0..i-1] is part of incoming command.
    while (i < buf.length) {
      switch (this._bufferState) {
        case BUFFER_STATE_LITERAL:
          const diff = Math.min(buf.length - i, this._literalRemaining);
          this._literalRemaining -= diff;
          i += diff;
          if (this._literalRemaining === 0) {
            this._bufferState = BUFFER_STATE_DEFAULT;
          }
          continue;

        case BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2:
          if (i < buf.length) {
            if (buf[i] === CARRIAGE_RETURN) {
              this._literalRemaining = Number((0, _common.fromTypedArray)(this._lengthBuffer)) + 2; // for CRLF
              this._bufferState = BUFFER_STATE_LITERAL;
            } else {
              this._bufferState = BUFFER_STATE_DEFAULT;
            }
            delete this._lengthBuffer;
          }
          continue;

        case BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1:
          const start = i;
          while (i < buf.length && buf[i] >= 48 && buf[i] <= 57) {
            // digits
            i++;
          }
          if (start !== i) {
            const latest = buf.subarray(start, i);
            const prevBuf = this._lengthBuffer;
            this._lengthBuffer = new Uint8Array(prevBuf.length + latest.length);
            this._lengthBuffer.set(prevBuf);
            this._lengthBuffer.set(latest, prevBuf.length);
          }
          if (i < buf.length) {
            if (this._lengthBuffer.length > 0 && buf[i] === RIGHT_CURLY_BRACKET) {
              this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_2;
            } else {
              delete this._lengthBuffer;
              this._bufferState = BUFFER_STATE_DEFAULT;
            }
            i++;
          }
          continue;

        default:
          // find literal length
          const leftIdx = buf.indexOf(LEFT_CURLY_BRACKET, i);
          if (leftIdx > -1) {
            const leftOfLeftCurly = new Uint8Array(buf.buffer, i, leftIdx - i);
            if (leftOfLeftCurly.indexOf(LINE_FEED) === -1) {
              i = leftIdx + 1;
              this._lengthBuffer = new Uint8Array(0);
              this._bufferState = BUFFER_STATE_POSSIBLY_LITERAL_LENGTH_1;
              continue;
            }
          }

          // find end of command
          const LFidx = buf.indexOf(LINE_FEED, i);
          if (LFidx > -1) {
            if (LFidx < buf.length - 1) {
              this._incomingBuffers[this._incomingBuffers.length - 1] = new Uint8Array(buf.buffer, 0, LFidx + 1);
            }
            const commandLength = this._incomingBuffers.reduce((prev, curr) => prev + curr.length, 0) - 2; // 2 for CRLF
            const command = new Uint8Array(commandLength);
            let index = 0;
            while (this._incomingBuffers.length > 0) {
              let uint8Array = this._incomingBuffers.shift();

              const remainingLength = commandLength - index;
              if (uint8Array.length > remainingLength) {
                const excessLength = uint8Array.length - remainingLength;
                uint8Array = uint8Array.subarray(0, -excessLength);

                if (this._incomingBuffers.length > 0) {
                  this._incomingBuffers = [];
                }
              }
              command.set(uint8Array, index);
              index += uint8Array.length;
            }
            yield command;
            if (LFidx < buf.length - 1) {
              buf = new Uint8Array(buf.subarray(LFidx + 1));
              this._incomingBuffers.push(buf);
              i = 0;
            } else {
              // clear the timeout when an entire command has arrived
              // and not waiting on more data for next command
              clearTimeout(this._socketTimeoutTimer);
              this._socketTimeoutTimer = null;
              return;
            }
          } else {
            return;
          }
      }
    }
  }

  // PRIVATE METHODS

  /**
   * Processes a command from the queue. The command is parsed and feeded to a handler
   */
  _parseIncomingCommands(commands) {
    for (var command of commands) {
      this._clearIdle();

      /*
       * The "+"-tagged response is a special case:
       * Either the server can asks for the next chunk of data, e.g. for the AUTHENTICATE command.
       *
       * Or there was an error in the XOAUTH2 authentication, for which SASL initial client response extension
       * dictates the client sends an empty EOL response to the challenge containing the error message.
       *
       * Details on "+"-tagged response:
       *   https://tools.ietf.org/html/rfc3501#section-2.2.1
       */
      //
      if (command[0] === ASCII_PLUS) {
        if (this._currentCommand.data.length) {
          // feed the next chunk of data
          var chunk = this._currentCommand.data.shift();
          chunk += !this._currentCommand.data.length ? EOL : ''; // EOL if there's nothing more to send
          this.send(chunk);
        } else if (this._currentCommand.errorResponseExpectsEmptyLine) {
          this.send(EOL); // XOAUTH2 empty response, error will be reported when server continues with NO response
        }
        continue;
      }

      var response;
      try {
        const valueAsString = this._currentCommand.request && this._currentCommand.request.valueAsString;
        response = (0, _emailjsImapHandler.parser)(command, { valueAsString });
        this.logger.debug('S:', () => (0, _emailjsImapHandler.compiler)(response, false, true));
      } catch (e) {
        this.logger.error('Error parsing imap command!', response);
        return this._onError(e);
      }

      this._processResponse(response);
      this._handleResponse(response);

      // first response from the server, connection is now usable
      if (!this._connectionReady) {
        this._connectionReady = true;
        this.onready && this.onready();
      }
    }
  }

  /**
   * Feeds a parsed response object to an appropriate handler
   *
   * @param {Object} response Parsed command object
   */
  _handleResponse(response) {
    var command = (0, _ramda.propOr)('', 'command', response).toUpperCase().trim();

    if (!this._currentCommand) {
      // unsolicited untagged response
      if (response.tag === '*' && command in this._globalAcceptUntagged) {
        this._globalAcceptUntagged[command](response);
        this._canSend = true;
        this._sendRequest();
      }
    } else if (this._currentCommand.payload && response.tag === '*' && command in this._currentCommand.payload) {
      // expected untagged response
      this._currentCommand.payload[command].push(response);
    } else if (response.tag === '*' && command in this._globalAcceptUntagged) {
      // unexpected untagged response
      this._globalAcceptUntagged[command](response);
    } else if (response.tag === this._currentCommand.tag) {
      // tagged response
      if (this._currentCommand.payload && Object.keys(this._currentCommand.payload).length) {
        response.payload = this._currentCommand.payload;
      }
      this._currentCommand.callback(response);
      this._canSend = true;
      this._sendRequest();
    }
  }

  /**
   * Sends a command from client queue to the server.
   */
  _sendRequest() {
    if (!this._clientQueue.length) {
      return this._enterIdle();
    }
    this._clearIdle();

    // an operation was made in the precheck, no need to restart the queue manually
    this._restartQueue = false;

    var command = this._clientQueue[0];
    if (typeof command.precheck === 'function') {
      // remember the context
      var context = command;
      var precheck = context.precheck;
      delete context.precheck;

      // we need to restart the queue handling if no operation was made in the precheck
      this._restartQueue = true;

      // invoke the precheck command and resume normal operation after the promise resolves
      precheck(context).then(() => {
        // we're done with the precheck
        if (this._restartQueue) {
          // we need to restart the queue handling
          this._sendRequest();
        }
      }).catch(err => {
        // precheck failed, so we remove the initial command
        // from the queue, invoke its callback and resume normal operation
        let cmd;
        const index = this._clientQueue.indexOf(context);
        if (index >= 0) {
          cmd = this._clientQueue.splice(index, 1)[0];
        }
        if (cmd && cmd.callback) {
          cmd.callback(err);
          this._canSend = true;
          this._parseIncomingCommands(this._iterateIncomingBuffer()); // Consume the rest of the incoming buffer
          this._sendRequest(); // continue sending
        }
      });
      return;
    }

    this._canSend = false;
    this._currentCommand = this._clientQueue.shift();

    try {
      this._currentCommand.data = (0, _emailjsImapHandler.compiler)(this._currentCommand.request, true);
      this.logger.debug('C:', () => (0, _emailjsImapHandler.compiler)(this._currentCommand.request, false, true)); // excludes passwords etc.
    } catch (e) {
      this.logger.error('Error compiling imap command!', this._currentCommand.request);
      return this._onError(new Error('Error compiling imap command!'));
    }

    var data = this._currentCommand.data.shift();

    this.send(data + (!this._currentCommand.data.length ? EOL : ''));
    return this.waitDrain;
  }

  /**
   * Emits onidle, noting to do currently
   */
  _enterIdle() {
    clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => this.onidle && this.onidle(), this.timeoutEnterIdle);
  }

  /**
   * Cancel idle timer
   */
  _clearIdle() {
    clearTimeout(this._idleTimer);
    this._idleTimer = null;
  }

  /**
   * Method processes a response into an easier to handle format.
   * Add untagged numbered responses (e.g. FETCH) into a nicely feasible form
   * Checks if a response includes optional response codes
   * and copies these into separate properties. For example the
   * following response includes a capability listing and a human
   * readable message:
   *
   *     * OK [CAPABILITY ID NAMESPACE] All ready
   *
   * This method adds a 'capability' property with an array value ['ID', 'NAMESPACE']
   * to the response object. Additionally 'All ready' is added as 'humanReadable' property.
   *
   * See possiblem IMAP Response Codes at https://tools.ietf.org/html/rfc5530
   *
   * @param {Object} response Parsed response object
   */
  _processResponse(response) {
    let command = (0, _ramda.propOr)('', 'command', response).toUpperCase().trim();

    // no attributes
    if (!response || !response.attributes || !response.attributes.length) {
      return;
    }

    // untagged responses w/ sequence numbers
    if (response.tag === '*' && /^\d+$/.test(response.command) && response.attributes[0].type === 'ATOM') {
      response.nr = Number(response.command);
      response.command = (response.attributes.shift().value || '').toString().toUpperCase().trim();
    }

    // no optional response code
    if (['OK', 'NO', 'BAD', 'BYE', 'PREAUTH'].indexOf(command) < 0) {
      return;
    }

    // If last element of the response is TEXT then this is for humans
    if (response.attributes[response.attributes.length - 1].type === 'TEXT') {
      response.humanReadable = response.attributes[response.attributes.length - 1].value;
    }

    // Parse and format ATOM values
    if (response.attributes[0].type === 'ATOM' && response.attributes[0].section) {
      const option = response.attributes[0].section.map(key => {
        if (!key) {
          return;
        }
        if (Array.isArray(key)) {
          return key.map(key => (key.value || '').toString().trim());
        } else {
          return (key.value || '').toString().toUpperCase().trim();
        }
      });

      const key = option.shift();
      response.code = key;

      if (option.length === 1) {
        response[key.toLowerCase()] = option[0];
      } else if (option.length > 1) {
        response[key.toLowerCase()] = option;
      }
    }
  }

  /**
   * Checks if a value is an Error object
   *
   * @param {Mixed} value Value to be checked
   * @return {Boolean} returns true if the value is an Error
   */
  isError(value) {
    return !!Object.prototype.toString.call(value).match(/Error\]$/);
  }

  // COMPRESSION RELATED METHODS

  /**
   * Sets up deflate/inflate for the IO
   */
  enableCompression() {
    this._socketOnData = this.socket.ondata;
    this.compressed = true;

    if (typeof window !== 'undefined' && window.Worker) {
      this._compressionWorker = new Worker(URL.createObjectURL(new Blob([CompressionBlob])));
      this._compressionWorker.onmessage = e => {
        var message = e.data.message;
        var data = e.data.buffer;

        switch (message) {
          case MESSAGE_INFLATED_DATA_READY:
            this._socketOnData({ data });
            break;

          case MESSAGE_DEFLATED_DATA_READY:
            this.waitDrain = this.socket.send(data);
            break;
        }
      };

      this._compressionWorker.onerror = e => {
        this._onError(new Error('Error handling compression web worker: ' + e.message));
      };

      this._compressionWorker.postMessage(createMessage(MESSAGE_INITIALIZE_WORKER));
    } else {
      const inflatedReady = buffer => {
        this._socketOnData({ data: buffer });
      };
      const deflatedReady = buffer => {
        this.waitDrain = this.socket.send(buffer);
      };
      this._compression = new _compression2.default(inflatedReady, deflatedReady);
    }

    // override data handler, decompress incoming data
    this.socket.ondata = evt => {
      if (!this.compressed) {
        return;
      }

      if (this._compressionWorker) {
        this._compressionWorker.postMessage(createMessage(MESSAGE_INFLATE, evt.data), [evt.data]);
      } else {
        this._compression.inflate(evt.data);
      }
    };
  }

  /**
   * Undoes any changes related to compression. This only be called when closing the connection
   */
  _disableCompression() {
    if (!this.compressed) {
      return;
    }

    this.compressed = false;
    this.socket.ondata = this._socketOnData;
    this._socketOnData = null;

    if (this._compressionWorker) {
      // terminate the worker
      this._compressionWorker.terminate();
      this._compressionWorker = null;
    }
  }

  /**
   * Outgoing payload needs to be compressed and sent to socket
   *
   * @param {ArrayBuffer} buffer Outgoing uncompressed arraybuffer
   */
  _sendCompressed(buffer) {
    // deflate
    if (this._compressionWorker) {
      this._compressionWorker.postMessage(createMessage(MESSAGE_DEFLATE, buffer), [buffer]);
    } else {
      this._compression.deflate(buffer);
    }
  }
}

exports.default = Imap;
const createMessage = (message, buffer) => ({ message, buffer });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbWFwLmpzIl0sIm5hbWVzIjpbIk1FU1NBR0VfSU5JVElBTElaRV9XT1JLRVIiLCJNRVNTQUdFX0lORkxBVEUiLCJNRVNTQUdFX0lORkxBVEVEX0RBVEFfUkVBRFkiLCJNRVNTQUdFX0RFRkxBVEUiLCJNRVNTQUdFX0RFRkxBVEVEX0RBVEFfUkVBRFkiLCJFT0wiLCJMSU5FX0ZFRUQiLCJDQVJSSUFHRV9SRVRVUk4iLCJMRUZUX0NVUkxZX0JSQUNLRVQiLCJSSUdIVF9DVVJMWV9CUkFDS0VUIiwiQVNDSUlfUExVUyIsIkJVRkZFUl9TVEFURV9MSVRFUkFMIiwiQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzEiLCJCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMiIsIkJVRkZFUl9TVEFURV9ERUZBVUxUIiwiVElNRU9VVF9FTlRFUl9JRExFIiwiVElNRU9VVF9TT0NLRVRfTE9XRVJfQk9VTkQiLCJUSU1FT1VUX1NPQ0tFVF9NVUxUSVBMSUVSIiwiSW1hcCIsImNvbnN0cnVjdG9yIiwiaG9zdCIsInBvcnQiLCJvcHRpb25zIiwidGltZW91dEVudGVySWRsZSIsInRpbWVvdXRTb2NrZXRMb3dlckJvdW5kIiwidGltZW91dFNvY2tldE11bHRpcGxpZXIiLCJ1c2VTZWN1cmVUcmFuc3BvcnQiLCJzZWN1cmVNb2RlIiwiX2Nvbm5lY3Rpb25SZWFkeSIsIl9nbG9iYWxBY2NlcHRVbnRhZ2dlZCIsIl9jbGllbnRRdWV1ZSIsIl9jYW5TZW5kIiwiX3RhZ0NvdW50ZXIiLCJfY3VycmVudENvbW1hbmQiLCJfaWRsZVRpbWVyIiwiX3NvY2tldFRpbWVvdXRUaW1lciIsImNvbXByZXNzZWQiLCJfaW5jb21pbmdCdWZmZXJzIiwiX2J1ZmZlclN0YXRlIiwiX2xpdGVyYWxSZW1haW5pbmciLCJvbmNlcnQiLCJvbmVycm9yIiwib25yZWFkeSIsIm9uaWRsZSIsImNvbm5lY3QiLCJTb2NrZXQiLCJUQ1BTb2NrZXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNvY2tldCIsIm9wZW4iLCJiaW5hcnlUeXBlIiwiY2EiLCJjZXJ0IiwiRSIsIm9uY2xvc2UiLCJfb25FcnJvciIsIkVycm9yIiwib25kYXRhIiwiZXZ0IiwiX29uRGF0YSIsImVyciIsImUiLCJkYXRhIiwibWVzc2FnZSIsIm9ub3BlbiIsImNsb3NlIiwiZXJyb3IiLCJ0ZWFyRG93biIsImZvckVhY2giLCJjbWQiLCJjYWxsYmFjayIsImNsZWFyVGltZW91dCIsIl9kaXNhYmxlQ29tcHJlc3Npb24iLCJyZWFkeVN0YXRlIiwibG9nb3V0IiwidGhlbiIsImNhdGNoIiwiZW5xdWV1ZUNvbW1hbmQiLCJ1cGdyYWRlIiwidXBncmFkZVRvU2VjdXJlIiwicmVxdWVzdCIsImFjY2VwdFVudGFnZ2VkIiwiY29tbWFuZCIsImNvbmNhdCIsIm1hcCIsInVudGFnZ2VkIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRyaW0iLCJ0YWciLCJwYXlsb2FkIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwicmVzcG9uc2UiLCJpc0Vycm9yIiwiaW5kZXhPZiIsImh1bWFuUmVhZGFibGUiLCJjb2RlIiwiT2JqZWN0Iiwia2V5cyIsImtleSIsImluZGV4IiwiY3R4Iiwic3BsaWNlIiwicHVzaCIsIl9zZW5kUmVxdWVzdCIsImdldFByZXZpb3VzbHlRdWV1ZWQiLCJjb21tYW5kcyIsInN0YXJ0SW5kZXgiLCJpIiwiaXNNYXRjaCIsInNlbmQiLCJzdHIiLCJidWZmZXIiLCJ0aW1lb3V0IiwiTWF0aCIsImZsb29yIiwiYnl0ZUxlbmd0aCIsInNldFRpbWVvdXQiLCJfc2VuZENvbXByZXNzZWQiLCJzZXRIYW5kbGVyIiwibG9nZ2VyIiwiVWludDhBcnJheSIsIl9wYXJzZUluY29taW5nQ29tbWFuZHMiLCJfaXRlcmF0ZUluY29taW5nQnVmZmVyIiwiYnVmIiwiZGlmZiIsIm1pbiIsIk51bWJlciIsIl9sZW5ndGhCdWZmZXIiLCJzdGFydCIsImxhdGVzdCIsInN1YmFycmF5IiwicHJldkJ1ZiIsInNldCIsImxlZnRJZHgiLCJsZWZ0T2ZMZWZ0Q3VybHkiLCJMRmlkeCIsImNvbW1hbmRMZW5ndGgiLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsInVpbnQ4QXJyYXkiLCJzaGlmdCIsInJlbWFpbmluZ0xlbmd0aCIsImV4Y2Vzc0xlbmd0aCIsIl9jbGVhcklkbGUiLCJjaHVuayIsImVycm9yUmVzcG9uc2VFeHBlY3RzRW1wdHlMaW5lIiwidmFsdWVBc1N0cmluZyIsImRlYnVnIiwiX3Byb2Nlc3NSZXNwb25zZSIsIl9oYW5kbGVSZXNwb25zZSIsIl9lbnRlcklkbGUiLCJfcmVzdGFydFF1ZXVlIiwicHJlY2hlY2siLCJjb250ZXh0Iiwid2FpdERyYWluIiwiYXR0cmlidXRlcyIsInRlc3QiLCJ0eXBlIiwibnIiLCJ2YWx1ZSIsInNlY3Rpb24iLCJvcHRpb24iLCJBcnJheSIsImlzQXJyYXkiLCJ0b0xvd2VyQ2FzZSIsInByb3RvdHlwZSIsImNhbGwiLCJtYXRjaCIsImVuYWJsZUNvbXByZXNzaW9uIiwiX3NvY2tldE9uRGF0YSIsIndpbmRvdyIsIldvcmtlciIsIl9jb21wcmVzc2lvbldvcmtlciIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJDb21wcmVzc2lvbkJsb2IiLCJvbm1lc3NhZ2UiLCJwb3N0TWVzc2FnZSIsImNyZWF0ZU1lc3NhZ2UiLCJpbmZsYXRlZFJlYWR5IiwiZGVmbGF0ZWRSZWFkeSIsIl9jb21wcmVzc2lvbiIsIkNvbXByZXNzaW9uIiwiaW5mbGF0ZSIsInRlcm1pbmF0ZSIsImRlZmxhdGUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBR0E7QUFDQTtBQUNBOztBQUNBLE1BQU1BLDRCQUE0QixPQUFsQztBQUNBLE1BQU1DLGtCQUFrQixTQUF4QjtBQUNBLE1BQU1DLDhCQUE4QixnQkFBcEM7QUFDQSxNQUFNQyxrQkFBa0IsU0FBeEI7QUFDQSxNQUFNQyw4QkFBOEIsZ0JBQXBDOztBQUVBLE1BQU1DLE1BQU0sTUFBWjtBQUNBLE1BQU1DLFlBQVksRUFBbEI7QUFDQSxNQUFNQyxrQkFBa0IsRUFBeEI7QUFDQSxNQUFNQyxxQkFBcUIsR0FBM0I7QUFDQSxNQUFNQyxzQkFBc0IsR0FBNUI7O0FBRUEsTUFBTUMsYUFBYSxFQUFuQjs7QUFFQTtBQUNBLE1BQU1DLHVCQUF1QixTQUE3QjtBQUNBLE1BQU1DLHlDQUF5QyxrQkFBL0M7QUFDQSxNQUFNQyx5Q0FBeUMsa0JBQS9DO0FBQ0EsTUFBTUMsdUJBQXVCLFNBQTdCOztBQUVBOzs7QUFHQSxNQUFNQyxxQkFBcUIsSUFBM0I7O0FBRUE7OztBQUdBLE1BQU1DLDZCQUE2QixLQUFuQzs7QUFFQTs7Ozs7OztBQU9BLE1BQU1DLDRCQUE0QixHQUFsQzs7QUFFQTs7Ozs7Ozs7Ozs7O0FBWWUsTUFBTUMsSUFBTixDQUFXO0FBQ3hCQyxjQUFhQyxJQUFiLEVBQW1CQyxJQUFuQixFQUF5QkMsVUFBVSxFQUFuQyxFQUF1QztBQUNyQyxTQUFLQyxnQkFBTCxHQUF3QlIsa0JBQXhCO0FBQ0EsU0FBS1MsdUJBQUwsR0FBK0JSLDBCQUEvQjtBQUNBLFNBQUtTLHVCQUFMLEdBQStCUix5QkFBL0I7O0FBRUEsU0FBS0ssT0FBTCxHQUFlQSxPQUFmOztBQUVBLFNBQUtELElBQUwsR0FBWUEsU0FBUyxLQUFLQyxPQUFMLENBQWFJLGtCQUFiLEdBQWtDLEdBQWxDLEdBQXdDLEdBQWpELENBQVo7QUFDQSxTQUFLTixJQUFMLEdBQVlBLFFBQVEsV0FBcEI7O0FBRUE7QUFDQSxTQUFLRSxPQUFMLENBQWFJLGtCQUFiLEdBQWtDLHdCQUF3QixLQUFLSixPQUE3QixHQUF1QyxDQUFDLENBQUMsS0FBS0EsT0FBTCxDQUFhSSxrQkFBdEQsR0FBMkUsS0FBS0wsSUFBTCxLQUFjLEdBQTNIOztBQUVBLFNBQUtNLFVBQUwsR0FBa0IsQ0FBQyxDQUFDLEtBQUtMLE9BQUwsQ0FBYUksa0JBQWpDLENBYnFDLENBYWU7O0FBRXBELFNBQUtFLGdCQUFMLEdBQXdCLEtBQXhCLENBZnFDLENBZVA7O0FBRTlCLFNBQUtDLHFCQUFMLEdBQTZCLEVBQTdCLENBakJxQyxDQWlCTDs7QUFFaEMsU0FBS0MsWUFBTCxHQUFvQixFQUFwQixDQW5CcUMsQ0FtQmQ7QUFDdkIsU0FBS0MsUUFBTCxHQUFnQixLQUFoQixDQXBCcUMsQ0FvQmY7QUFDdEIsU0FBS0MsV0FBTCxHQUFtQixDQUFuQixDQXJCcUMsQ0FxQmhCO0FBQ3JCLFNBQUtDLGVBQUwsR0FBdUIsS0FBdkIsQ0F0QnFDLENBc0JSOztBQUU3QixTQUFLQyxVQUFMLEdBQWtCLEtBQWxCLENBeEJxQyxDQXdCYjtBQUN4QixTQUFLQyxtQkFBTCxHQUEyQixLQUEzQixDQXpCcUMsQ0F5Qko7O0FBRWpDLFNBQUtDLFVBQUwsR0FBa0IsS0FBbEIsQ0EzQnFDLENBMkJiOztBQUV4QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixFQUF4QjtBQUNBLFNBQUtDLFlBQUwsR0FBb0J4QixvQkFBcEI7QUFDQSxTQUFLeUIsaUJBQUwsR0FBeUIsQ0FBekI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLElBQWQ7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBZixDQTFDcUMsQ0EwQ2pCO0FBQ3BCLFNBQUtDLE9BQUwsR0FBZSxJQUFmLENBM0NxQyxDQTJDakI7QUFDcEIsU0FBS0MsTUFBTCxHQUFjLElBQWQsQ0E1Q3FDLENBNENsQjtBQUNwQjs7QUFFRDs7QUFFQTs7Ozs7Ozs7OztBQVVBQyxVQUFTQyxTQUFTQywwQkFBbEIsRUFBNkI7QUFDM0IsV0FBTyxJQUFJQyxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3RDLFdBQUtDLE1BQUwsR0FBY0wsT0FBT00sSUFBUCxDQUFZLEtBQUsvQixJQUFqQixFQUF1QixLQUFLQyxJQUE1QixFQUFrQztBQUM5QytCLG9CQUFZLGFBRGtDO0FBRTlDMUIsNEJBQW9CLEtBQUtDLFVBRnFCO0FBRzlDMEIsWUFBSSxLQUFLL0IsT0FBTCxDQUFhK0I7QUFINkIsT0FBbEMsQ0FBZDs7QUFNQTtBQUNBO0FBQ0EsVUFBSTtBQUNGLGFBQUtILE1BQUwsQ0FBWVYsTUFBWixHQUFzQmMsSUFBRCxJQUFVO0FBQUUsZUFBS2QsTUFBTCxJQUFlLEtBQUtBLE1BQUwsQ0FBWWMsSUFBWixDQUFmO0FBQWtDLFNBQW5FO0FBQ0QsT0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVSxDQUFHOztBQUVmO0FBQ0EsV0FBS0wsTUFBTCxDQUFZTSxPQUFaLEdBQXNCLE1BQU0sS0FBS0MsUUFBTCxDQUFjLElBQUlDLEtBQUosQ0FBVSw2QkFBVixDQUFkLENBQTVCO0FBQ0EsV0FBS1IsTUFBTCxDQUFZUyxNQUFaLEdBQXNCQyxHQUFELElBQVM7QUFDNUIsWUFBSTtBQUNGLGVBQUtDLE9BQUwsQ0FBYUQsR0FBYjtBQUNELFNBRkQsQ0FFRSxPQUFPRSxHQUFQLEVBQVk7QUFDWixlQUFLTCxRQUFMLENBQWNLLEdBQWQ7QUFDRDtBQUNGLE9BTkQ7O0FBUUE7QUFDQSxXQUFLWixNQUFMLENBQVlULE9BQVosR0FBdUJzQixDQUFELElBQU87QUFDM0JkLGVBQU8sSUFBSVMsS0FBSixDQUFVLDRCQUE0QkssRUFBRUMsSUFBRixDQUFPQyxPQUE3QyxDQUFQO0FBQ0QsT0FGRDs7QUFJQSxXQUFLZixNQUFMLENBQVlnQixNQUFaLEdBQXFCLE1BQU07QUFDekI7QUFDQSxhQUFLaEIsTUFBTCxDQUFZVCxPQUFaLEdBQXVCc0IsQ0FBRCxJQUFPLEtBQUtOLFFBQUwsQ0FBY00sQ0FBZCxDQUE3QjtBQUNBZjtBQUNELE9BSkQ7QUFLRCxLQWpDTSxDQUFQO0FBa0NEOztBQUVEOzs7OztBQUtBbUIsUUFBT0MsS0FBUCxFQUFjO0FBQ1osV0FBTyxJQUFJckIsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDOUIsVUFBSXFCLFdBQVcsTUFBTTtBQUNuQjtBQUNBLGFBQUt2QyxZQUFMLENBQWtCd0MsT0FBbEIsQ0FBMEJDLE9BQU9BLElBQUlDLFFBQUosQ0FBYUosS0FBYixDQUFqQztBQUNBLFlBQUksS0FBS25DLGVBQVQsRUFBMEI7QUFDeEIsZUFBS0EsZUFBTCxDQUFxQnVDLFFBQXJCLENBQThCSixLQUE5QjtBQUNEOztBQUVELGFBQUt0QyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0EsYUFBS0csZUFBTCxHQUF1QixLQUF2Qjs7QUFFQXdDLHFCQUFhLEtBQUt2QyxVQUFsQjtBQUNBLGFBQUtBLFVBQUwsR0FBa0IsSUFBbEI7O0FBRUF1QyxxQkFBYSxLQUFLdEMsbUJBQWxCO0FBQ0EsYUFBS0EsbUJBQUwsR0FBMkIsSUFBM0I7O0FBRUEsWUFBSSxLQUFLZSxNQUFULEVBQWlCO0FBQ2Y7QUFDQSxlQUFLQSxNQUFMLENBQVlnQixNQUFaLEdBQXFCLElBQXJCO0FBQ0EsZUFBS2hCLE1BQUwsQ0FBWU0sT0FBWixHQUFzQixJQUF0QjtBQUNBLGVBQUtOLE1BQUwsQ0FBWVMsTUFBWixHQUFxQixJQUFyQjtBQUNBLGVBQUtULE1BQUwsQ0FBWVQsT0FBWixHQUFzQixJQUF0QjtBQUNBLGNBQUk7QUFDRixpQkFBS1MsTUFBTCxDQUFZVixNQUFaLEdBQXFCLElBQXJCO0FBQ0QsV0FGRCxDQUVFLE9BQU9lLENBQVAsRUFBVSxDQUFHOztBQUVmLGVBQUtMLE1BQUwsR0FBYyxJQUFkO0FBQ0Q7O0FBRURGO0FBQ0QsT0E5QkQ7O0FBZ0NBLFdBQUswQixtQkFBTDs7QUFFQSxVQUFJLENBQUMsS0FBS3hCLE1BQU4sSUFBZ0IsS0FBS0EsTUFBTCxDQUFZeUIsVUFBWixLQUEyQixNQUEvQyxFQUF1RDtBQUNyRCxlQUFPTixVQUFQO0FBQ0Q7O0FBRUQsV0FBS25CLE1BQUwsQ0FBWU0sT0FBWixHQUFzQixLQUFLTixNQUFMLENBQVlULE9BQVosR0FBc0I0QixRQUE1QyxDQXZDOEIsQ0F1Q3VCO0FBQ3JELFdBQUtuQixNQUFMLENBQVlpQixLQUFaO0FBQ0QsS0F6Q00sQ0FBUDtBQTBDRDs7QUFFRDs7Ozs7OztBQU9BUyxXQUFVO0FBQ1IsV0FBTyxJQUFJN0IsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN0QyxXQUFLQyxNQUFMLENBQVlNLE9BQVosR0FBc0IsS0FBS04sTUFBTCxDQUFZVCxPQUFaLEdBQXNCLE1BQU07QUFDaEQsYUFBSzBCLEtBQUwsQ0FBVyxvQkFBWCxFQUFpQ1UsSUFBakMsQ0FBc0M3QixPQUF0QyxFQUErQzhCLEtBQS9DLENBQXFEN0IsTUFBckQ7QUFDRCxPQUZEOztBQUlBLFdBQUs4QixjQUFMLENBQW9CLFFBQXBCO0FBQ0QsS0FOTSxDQUFQO0FBT0Q7O0FBRUQ7OztBQUdBQyxZQUFXO0FBQ1QsU0FBS3JELFVBQUwsR0FBa0IsSUFBbEI7QUFDQSxTQUFLdUIsTUFBTCxDQUFZK0IsZUFBWjtBQUNEOztBQUVEOzs7Ozs7Ozs7Ozs7OztBQWNBRixpQkFBZ0JHLE9BQWhCLEVBQXlCQyxjQUF6QixFQUF5QzdELE9BQXpDLEVBQWtEO0FBQ2hELFFBQUksT0FBTzRELE9BQVAsS0FBbUIsUUFBdkIsRUFBaUM7QUFDL0JBLGdCQUFVO0FBQ1JFLGlCQUFTRjtBQURELE9BQVY7QUFHRDs7QUFFREMscUJBQWlCLEdBQUdFLE1BQUgsQ0FBVUYsa0JBQWtCLEVBQTVCLEVBQWdDRyxHQUFoQyxDQUFxQ0MsUUFBRCxJQUFjLENBQUNBLFlBQVksRUFBYixFQUFpQkMsUUFBakIsR0FBNEJDLFdBQTVCLEdBQTBDQyxJQUExQyxFQUFsRCxDQUFqQjs7QUFFQSxRQUFJQyxNQUFNLE1BQU8sRUFBRSxLQUFLM0QsV0FBeEI7QUFDQWtELFlBQVFTLEdBQVIsR0FBY0EsR0FBZDs7QUFFQSxXQUFPLElBQUk1QyxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3RDLFVBQUllLE9BQU87QUFDVDJCLGFBQUtBLEdBREk7QUFFVFQsaUJBQVNBLE9BRkE7QUFHVFUsaUJBQVNULGVBQWVVLE1BQWYsR0FBd0IsRUFBeEIsR0FBNkJDLFNBSDdCO0FBSVR0QixrQkFBV3VCLFFBQUQsSUFBYztBQUN0QixjQUFJLEtBQUtDLE9BQUwsQ0FBYUQsUUFBYixDQUFKLEVBQTRCO0FBQzFCLG1CQUFPOUMsT0FBTzhDLFFBQVAsQ0FBUDtBQUNELFdBRkQsTUFFTyxJQUFJLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBY0UsT0FBZCxDQUFzQixtQkFBTyxFQUFQLEVBQVcsU0FBWCxFQUFzQkYsUUFBdEIsRUFBZ0NOLFdBQWhDLEdBQThDQyxJQUE5QyxFQUF0QixLQUErRSxDQUFuRixFQUFzRjtBQUMzRixnQkFBSXRCLFFBQVEsSUFBSVYsS0FBSixDQUFVcUMsU0FBU0csYUFBVCxJQUEwQixPQUFwQyxDQUFaO0FBQ0EsZ0JBQUlILFNBQVNJLElBQWIsRUFBbUI7QUFDakIvQixvQkFBTStCLElBQU4sR0FBYUosU0FBU0ksSUFBdEI7QUFDRDtBQUNELG1CQUFPbEQsT0FBT21CLEtBQVAsQ0FBUDtBQUNEOztBQUVEcEIsa0JBQVErQyxRQUFSO0FBQ0Q7O0FBR0g7QUFuQlcsT0FBWCxDQW9CQUssT0FBT0MsSUFBUCxDQUFZL0UsV0FBVyxFQUF2QixFQUEyQmdELE9BQTNCLENBQW9DZ0MsR0FBRCxJQUFTO0FBQUV0QyxhQUFLc0MsR0FBTCxJQUFZaEYsUUFBUWdGLEdBQVIsQ0FBWjtBQUEwQixPQUF4RTs7QUFFQW5CLHFCQUFlYixPQUFmLENBQXdCYyxPQUFELElBQWE7QUFBRXBCLGFBQUs0QixPQUFMLENBQWFSLE9BQWIsSUFBd0IsRUFBeEI7QUFBNEIsT0FBbEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBSW1CLFFBQVF2QyxLQUFLd0MsR0FBTCxHQUFXLEtBQUsxRSxZQUFMLENBQWtCbUUsT0FBbEIsQ0FBMEJqQyxLQUFLd0MsR0FBL0IsQ0FBWCxHQUFpRCxDQUFDLENBQTlEO0FBQ0EsVUFBSUQsU0FBUyxDQUFiLEVBQWdCO0FBQ2R2QyxhQUFLMkIsR0FBTCxJQUFZLElBQVo7QUFDQTNCLGFBQUtrQixPQUFMLENBQWFTLEdBQWIsSUFBb0IsSUFBcEI7QUFDQSxhQUFLN0QsWUFBTCxDQUFrQjJFLE1BQWxCLENBQXlCRixLQUF6QixFQUFnQyxDQUFoQyxFQUFtQ3ZDLElBQW5DO0FBQ0QsT0FKRCxNQUlPO0FBQ0wsYUFBS2xDLFlBQUwsQ0FBa0I0RSxJQUFsQixDQUF1QjFDLElBQXZCO0FBQ0Q7O0FBRUQsVUFBSSxLQUFLakMsUUFBVCxFQUFtQjtBQUNqQixhQUFLNEUsWUFBTDtBQUNEO0FBQ0YsS0F4Q00sQ0FBUDtBQXlDRDs7QUFFRDs7Ozs7O0FBTUFDLHNCQUFxQkMsUUFBckIsRUFBK0JMLEdBQS9CLEVBQW9DO0FBQ2xDLFVBQU1NLGFBQWEsS0FBS2hGLFlBQUwsQ0FBa0JtRSxPQUFsQixDQUEwQk8sR0FBMUIsSUFBaUMsQ0FBcEQ7O0FBRUE7QUFDQSxTQUFLLElBQUlPLElBQUlELFVBQWIsRUFBeUJDLEtBQUssQ0FBOUIsRUFBaUNBLEdBQWpDLEVBQXNDO0FBQ3BDLFVBQUlDLFFBQVEsS0FBS2xGLFlBQUwsQ0FBa0JpRixDQUFsQixDQUFSLENBQUosRUFBbUM7QUFDakMsZUFBTyxLQUFLakYsWUFBTCxDQUFrQmlGLENBQWxCLENBQVA7QUFDRDtBQUNGOztBQUVEO0FBQ0EsUUFBSUMsUUFBUSxLQUFLL0UsZUFBYixDQUFKLEVBQW1DO0FBQ2pDLGFBQU8sS0FBS0EsZUFBWjtBQUNEOztBQUVELFdBQU8sS0FBUDs7QUFFQSxhQUFTK0UsT0FBVCxDQUFrQmhELElBQWxCLEVBQXdCO0FBQ3RCLGFBQU9BLFFBQVFBLEtBQUtrQixPQUFiLElBQXdCMkIsU0FBU1osT0FBVCxDQUFpQmpDLEtBQUtrQixPQUFMLENBQWFFLE9BQTlCLEtBQTBDLENBQXpFO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7O0FBTUE2QixPQUFNQyxHQUFOLEVBQVc7QUFDVCxVQUFNQyxTQUFTLDBCQUFhRCxHQUFiLEVBQWtCQyxNQUFqQztBQUNBLFVBQU1DLFVBQVUsS0FBSzVGLHVCQUFMLEdBQStCNkYsS0FBS0MsS0FBTCxDQUFXSCxPQUFPSSxVQUFQLEdBQW9CLEtBQUs5Rix1QkFBcEMsQ0FBL0M7O0FBRUFnRCxpQkFBYSxLQUFLdEMsbUJBQWxCLEVBSlMsQ0FJOEI7QUFDdkMsU0FBS0EsbUJBQUwsR0FBMkJxRixXQUFXLE1BQU0sS0FBSy9ELFFBQUwsQ0FBYyxJQUFJQyxLQUFKLENBQVUsb0JBQVYsQ0FBZCxDQUFqQixFQUFpRTBELE9BQWpFLENBQTNCLENBTFMsQ0FLNEY7O0FBRXJHLFFBQUksS0FBS2hGLFVBQVQsRUFBcUI7QUFDbkIsV0FBS3FGLGVBQUwsQ0FBcUJOLE1BQXJCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBS2pFLE1BQUwsQ0FBWStELElBQVosQ0FBaUJFLE1BQWpCO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7Ozs7QUFRQU8sYUFBWXRDLE9BQVosRUFBcUJaLFFBQXJCLEVBQStCO0FBQzdCLFNBQUszQyxxQkFBTCxDQUEyQnVELFFBQVFLLFdBQVIsR0FBc0JDLElBQXRCLEVBQTNCLElBQTJEbEIsUUFBM0Q7QUFDRDs7QUFFRDs7QUFFQTs7Ozs7O0FBTUFmLFdBQVVHLEdBQVYsRUFBZTtBQUNiLFFBQUlRLEtBQUo7QUFDQSxRQUFJLEtBQUs0QixPQUFMLENBQWFwQyxHQUFiLENBQUosRUFBdUI7QUFDckJRLGNBQVFSLEdBQVI7QUFDRCxLQUZELE1BRU8sSUFBSUEsT0FBTyxLQUFLb0MsT0FBTCxDQUFhcEMsSUFBSUksSUFBakIsQ0FBWCxFQUFtQztBQUN4Q0ksY0FBUVIsSUFBSUksSUFBWjtBQUNELEtBRk0sTUFFQTtBQUNMSSxjQUFRLElBQUlWLEtBQUosQ0FBV0UsT0FBT0EsSUFBSUksSUFBWCxJQUFtQkosSUFBSUksSUFBSixDQUFTQyxPQUE3QixJQUF5Q0wsSUFBSUksSUFBN0MsSUFBcURKLEdBQXJELElBQTRELE9BQXRFLENBQVI7QUFDRDs7QUFFRCxTQUFLK0QsTUFBTCxDQUFZdkQsS0FBWixDQUFrQkEsS0FBbEI7O0FBRUE7QUFDQSxTQUFLRCxLQUFMLENBQVdDLEtBQVgsRUFBa0JTLElBQWxCLENBQXVCLE1BQU07QUFDM0IsV0FBS3BDLE9BQUwsSUFBZ0IsS0FBS0EsT0FBTCxDQUFhMkIsS0FBYixDQUFoQjtBQUNELEtBRkQsRUFFRyxNQUFNO0FBQ1AsV0FBSzNCLE9BQUwsSUFBZ0IsS0FBS0EsT0FBTCxDQUFhMkIsS0FBYixDQUFoQjtBQUNELEtBSkQ7QUFLRDs7QUFFRDs7Ozs7Ozs7QUFRQVAsVUFBU0QsR0FBVCxFQUFjO0FBQ1phLGlCQUFhLEtBQUt0QyxtQkFBbEIsRUFEWSxDQUMyQjtBQUN2QyxVQUFNaUYsVUFBVSxLQUFLNUYsdUJBQUwsR0FBK0I2RixLQUFLQyxLQUFMLENBQVcsT0FBTyxLQUFLN0YsdUJBQXZCLENBQS9DLENBRlksQ0FFbUY7QUFDL0YsU0FBS1UsbUJBQUwsR0FBMkJxRixXQUFXLE1BQU0sS0FBSy9ELFFBQUwsQ0FBYyxJQUFJQyxLQUFKLENBQVUsb0JBQVYsQ0FBZCxDQUFqQixFQUFpRTBELE9BQWpFLENBQTNCOztBQUVBLFNBQUsvRSxnQkFBTCxDQUFzQnFFLElBQXRCLENBQTJCLElBQUlrQixVQUFKLENBQWVoRSxJQUFJSSxJQUFuQixDQUEzQixFQUxZLENBS3lDO0FBQ3JELFNBQUs2RCxzQkFBTCxDQUE0QixLQUFLQyxzQkFBTCxFQUE1QixFQU5ZLENBTStDO0FBQzVEOztBQUVELEdBQUVBLHNCQUFGLEdBQTRCO0FBQzFCLFFBQUlDLE1BQU0sS0FBSzFGLGdCQUFMLENBQXNCLEtBQUtBLGdCQUFMLENBQXNCd0QsTUFBdEIsR0FBK0IsQ0FBckQsS0FBMkQsRUFBckU7QUFDQSxRQUFJa0IsSUFBSSxDQUFSOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBT0EsSUFBSWdCLElBQUlsQyxNQUFmLEVBQXVCO0FBQ3JCLGNBQVEsS0FBS3ZELFlBQWI7QUFDRSxhQUFLM0Isb0JBQUw7QUFDRSxnQkFBTXFILE9BQU9YLEtBQUtZLEdBQUwsQ0FBU0YsSUFBSWxDLE1BQUosR0FBYWtCLENBQXRCLEVBQXlCLEtBQUt4RSxpQkFBOUIsQ0FBYjtBQUNBLGVBQUtBLGlCQUFMLElBQTBCeUYsSUFBMUI7QUFDQWpCLGVBQUtpQixJQUFMO0FBQ0EsY0FBSSxLQUFLekYsaUJBQUwsS0FBMkIsQ0FBL0IsRUFBa0M7QUFDaEMsaUJBQUtELFlBQUwsR0FBb0J4QixvQkFBcEI7QUFDRDtBQUNEOztBQUVGLGFBQUtELHNDQUFMO0FBQ0UsY0FBSWtHLElBQUlnQixJQUFJbEMsTUFBWixFQUFvQjtBQUNsQixnQkFBSWtDLElBQUloQixDQUFKLE1BQVd4RyxlQUFmLEVBQWdDO0FBQzlCLG1CQUFLZ0MsaUJBQUwsR0FBeUIyRixPQUFPLDRCQUFlLEtBQUtDLGFBQXBCLENBQVAsSUFBNkMsQ0FBdEUsQ0FEOEIsQ0FDMEM7QUFDeEUsbUJBQUs3RixZQUFMLEdBQW9CM0Isb0JBQXBCO0FBQ0QsYUFIRCxNQUdPO0FBQ0wsbUJBQUsyQixZQUFMLEdBQW9CeEIsb0JBQXBCO0FBQ0Q7QUFDRCxtQkFBTyxLQUFLcUgsYUFBWjtBQUNEO0FBQ0Q7O0FBRUYsYUFBS3ZILHNDQUFMO0FBQ0UsZ0JBQU13SCxRQUFRckIsQ0FBZDtBQUNBLGlCQUFPQSxJQUFJZ0IsSUFBSWxDLE1BQVIsSUFBa0JrQyxJQUFJaEIsQ0FBSixLQUFVLEVBQTVCLElBQWtDZ0IsSUFBSWhCLENBQUosS0FBVSxFQUFuRCxFQUF1RDtBQUFFO0FBQ3ZEQTtBQUNEO0FBQ0QsY0FBSXFCLFVBQVVyQixDQUFkLEVBQWlCO0FBQ2Ysa0JBQU1zQixTQUFTTixJQUFJTyxRQUFKLENBQWFGLEtBQWIsRUFBb0JyQixDQUFwQixDQUFmO0FBQ0Esa0JBQU13QixVQUFVLEtBQUtKLGFBQXJCO0FBQ0EsaUJBQUtBLGFBQUwsR0FBcUIsSUFBSVAsVUFBSixDQUFlVyxRQUFRMUMsTUFBUixHQUFpQndDLE9BQU94QyxNQUF2QyxDQUFyQjtBQUNBLGlCQUFLc0MsYUFBTCxDQUFtQkssR0FBbkIsQ0FBdUJELE9BQXZCO0FBQ0EsaUJBQUtKLGFBQUwsQ0FBbUJLLEdBQW5CLENBQXVCSCxNQUF2QixFQUErQkUsUUFBUTFDLE1BQXZDO0FBQ0Q7QUFDRCxjQUFJa0IsSUFBSWdCLElBQUlsQyxNQUFaLEVBQW9CO0FBQ2xCLGdCQUFJLEtBQUtzQyxhQUFMLENBQW1CdEMsTUFBbkIsR0FBNEIsQ0FBNUIsSUFBaUNrQyxJQUFJaEIsQ0FBSixNQUFXdEcsbUJBQWhELEVBQXFFO0FBQ25FLG1CQUFLNkIsWUFBTCxHQUFvQnpCLHNDQUFwQjtBQUNELGFBRkQsTUFFTztBQUNMLHFCQUFPLEtBQUtzSCxhQUFaO0FBQ0EsbUJBQUs3RixZQUFMLEdBQW9CeEIsb0JBQXBCO0FBQ0Q7QUFDRGlHO0FBQ0Q7QUFDRDs7QUFFRjtBQUNFO0FBQ0EsZ0JBQU0wQixVQUFVVixJQUFJOUIsT0FBSixDQUFZekYsa0JBQVosRUFBZ0N1RyxDQUFoQyxDQUFoQjtBQUNBLGNBQUkwQixVQUFVLENBQUMsQ0FBZixFQUFrQjtBQUNoQixrQkFBTUMsa0JBQWtCLElBQUlkLFVBQUosQ0FBZUcsSUFBSVosTUFBbkIsRUFBMkJKLENBQTNCLEVBQThCMEIsVUFBVTFCLENBQXhDLENBQXhCO0FBQ0EsZ0JBQUkyQixnQkFBZ0J6QyxPQUFoQixDQUF3QjNGLFNBQXhCLE1BQXVDLENBQUMsQ0FBNUMsRUFBK0M7QUFDN0N5RyxrQkFBSTBCLFVBQVUsQ0FBZDtBQUNBLG1CQUFLTixhQUFMLEdBQXFCLElBQUlQLFVBQUosQ0FBZSxDQUFmLENBQXJCO0FBQ0EsbUJBQUt0RixZQUFMLEdBQW9CMUIsc0NBQXBCO0FBQ0E7QUFDRDtBQUNGOztBQUVEO0FBQ0EsZ0JBQU0rSCxRQUFRWixJQUFJOUIsT0FBSixDQUFZM0YsU0FBWixFQUF1QnlHLENBQXZCLENBQWQ7QUFDQSxjQUFJNEIsUUFBUSxDQUFDLENBQWIsRUFBZ0I7QUFDZCxnQkFBSUEsUUFBUVosSUFBSWxDLE1BQUosR0FBYSxDQUF6QixFQUE0QjtBQUMxQixtQkFBS3hELGdCQUFMLENBQXNCLEtBQUtBLGdCQUFMLENBQXNCd0QsTUFBdEIsR0FBK0IsQ0FBckQsSUFBMEQsSUFBSStCLFVBQUosQ0FBZUcsSUFBSVosTUFBbkIsRUFBMkIsQ0FBM0IsRUFBOEJ3QixRQUFRLENBQXRDLENBQTFEO0FBQ0Q7QUFDRCxrQkFBTUMsZ0JBQWdCLEtBQUt2RyxnQkFBTCxDQUFzQndHLE1BQXRCLENBQTZCLENBQUNDLElBQUQsRUFBT0MsSUFBUCxLQUFnQkQsT0FBT0MsS0FBS2xELE1BQXpELEVBQWlFLENBQWpFLElBQXNFLENBQTVGLENBSmMsQ0FJZ0Y7QUFDOUYsa0JBQU1ULFVBQVUsSUFBSXdDLFVBQUosQ0FBZWdCLGFBQWYsQ0FBaEI7QUFDQSxnQkFBSXJDLFFBQVEsQ0FBWjtBQUNBLG1CQUFPLEtBQUtsRSxnQkFBTCxDQUFzQndELE1BQXRCLEdBQStCLENBQXRDLEVBQXlDO0FBQ3ZDLGtCQUFJbUQsYUFBYSxLQUFLM0csZ0JBQUwsQ0FBc0I0RyxLQUF0QixFQUFqQjs7QUFFQSxvQkFBTUMsa0JBQWtCTixnQkFBZ0JyQyxLQUF4QztBQUNBLGtCQUFJeUMsV0FBV25ELE1BQVgsR0FBb0JxRCxlQUF4QixFQUF5QztBQUN2QyxzQkFBTUMsZUFBZUgsV0FBV25ELE1BQVgsR0FBb0JxRCxlQUF6QztBQUNBRiw2QkFBYUEsV0FBV1YsUUFBWCxDQUFvQixDQUFwQixFQUF1QixDQUFDYSxZQUF4QixDQUFiOztBQUVBLG9CQUFJLEtBQUs5RyxnQkFBTCxDQUFzQndELE1BQXRCLEdBQStCLENBQW5DLEVBQXNDO0FBQ3BDLHVCQUFLeEQsZ0JBQUwsR0FBd0IsRUFBeEI7QUFDRDtBQUNGO0FBQ0QrQyxzQkFBUW9ELEdBQVIsQ0FBWVEsVUFBWixFQUF3QnpDLEtBQXhCO0FBQ0FBLHVCQUFTeUMsV0FBV25ELE1BQXBCO0FBQ0Q7QUFDRCxrQkFBTVQsT0FBTjtBQUNBLGdCQUFJdUQsUUFBUVosSUFBSWxDLE1BQUosR0FBYSxDQUF6QixFQUE0QjtBQUMxQmtDLG9CQUFNLElBQUlILFVBQUosQ0FBZUcsSUFBSU8sUUFBSixDQUFhSyxRQUFRLENBQXJCLENBQWYsQ0FBTjtBQUNBLG1CQUFLdEcsZ0JBQUwsQ0FBc0JxRSxJQUF0QixDQUEyQnFCLEdBQTNCO0FBQ0FoQixrQkFBSSxDQUFKO0FBQ0QsYUFKRCxNQUlPO0FBQ0w7QUFDQTtBQUNBdEMsMkJBQWEsS0FBS3RDLG1CQUFsQjtBQUNBLG1CQUFLQSxtQkFBTCxHQUEyQixJQUEzQjtBQUNBO0FBQ0Q7QUFDRixXQWxDRCxNQWtDTztBQUNMO0FBQ0Q7QUFoR0w7QUFrR0Q7QUFDRjs7QUFFRDs7QUFFQTs7O0FBR0EwRix5QkFBd0JoQixRQUF4QixFQUFrQztBQUNoQyxTQUFLLElBQUl6QixPQUFULElBQW9CeUIsUUFBcEIsRUFBOEI7QUFDNUIsV0FBS3VDLFVBQUw7O0FBRUE7Ozs7Ozs7Ozs7QUFVQTtBQUNBLFVBQUloRSxRQUFRLENBQVIsTUFBZTFFLFVBQW5CLEVBQStCO0FBQzdCLFlBQUksS0FBS3VCLGVBQUwsQ0FBcUIrQixJQUFyQixDQUEwQjZCLE1BQTlCLEVBQXNDO0FBQ3BDO0FBQ0EsY0FBSXdELFFBQVEsS0FBS3BILGVBQUwsQ0FBcUIrQixJQUFyQixDQUEwQmlGLEtBQTFCLEVBQVo7QUFDQUksbUJBQVUsQ0FBQyxLQUFLcEgsZUFBTCxDQUFxQitCLElBQXJCLENBQTBCNkIsTUFBM0IsR0FBb0N4RixHQUFwQyxHQUEwQyxFQUFwRCxDQUhvQyxDQUdvQjtBQUN4RCxlQUFLNEcsSUFBTCxDQUFVb0MsS0FBVjtBQUNELFNBTEQsTUFLTyxJQUFJLEtBQUtwSCxlQUFMLENBQXFCcUgsNkJBQXpCLEVBQXdEO0FBQzdELGVBQUtyQyxJQUFMLENBQVU1RyxHQUFWLEVBRDZELENBQzlDO0FBQ2hCO0FBQ0Q7QUFDRDs7QUFFRCxVQUFJMEYsUUFBSjtBQUNBLFVBQUk7QUFDRixjQUFNd0QsZ0JBQWdCLEtBQUt0SCxlQUFMLENBQXFCaUQsT0FBckIsSUFBZ0MsS0FBS2pELGVBQUwsQ0FBcUJpRCxPQUFyQixDQUE2QnFFLGFBQW5GO0FBQ0F4RCxtQkFBVyxnQ0FBT1gsT0FBUCxFQUFnQixFQUFFbUUsYUFBRixFQUFoQixDQUFYO0FBQ0EsYUFBSzVCLE1BQUwsQ0FBWTZCLEtBQVosQ0FBa0IsSUFBbEIsRUFBd0IsTUFBTSxrQ0FBU3pELFFBQVQsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsQ0FBOUI7QUFDRCxPQUpELENBSUUsT0FBT2hDLENBQVAsRUFBVTtBQUNWLGFBQUs0RCxNQUFMLENBQVl2RCxLQUFaLENBQWtCLDZCQUFsQixFQUFpRDJCLFFBQWpEO0FBQ0EsZUFBTyxLQUFLdEMsUUFBTCxDQUFjTSxDQUFkLENBQVA7QUFDRDs7QUFFRCxXQUFLMEYsZ0JBQUwsQ0FBc0IxRCxRQUF0QjtBQUNBLFdBQUsyRCxlQUFMLENBQXFCM0QsUUFBckI7O0FBRUE7QUFDQSxVQUFJLENBQUMsS0FBS25FLGdCQUFWLEVBQTRCO0FBQzFCLGFBQUtBLGdCQUFMLEdBQXdCLElBQXhCO0FBQ0EsYUFBS2MsT0FBTCxJQUFnQixLQUFLQSxPQUFMLEVBQWhCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7OztBQUtBZ0gsa0JBQWlCM0QsUUFBakIsRUFBMkI7QUFDekIsUUFBSVgsVUFBVSxtQkFBTyxFQUFQLEVBQVcsU0FBWCxFQUFzQlcsUUFBdEIsRUFBZ0NOLFdBQWhDLEdBQThDQyxJQUE5QyxFQUFkOztBQUVBLFFBQUksQ0FBQyxLQUFLekQsZUFBVixFQUEyQjtBQUN6QjtBQUNBLFVBQUk4RCxTQUFTSixHQUFULEtBQWlCLEdBQWpCLElBQXdCUCxXQUFXLEtBQUt2RCxxQkFBNUMsRUFBbUU7QUFDakUsYUFBS0EscUJBQUwsQ0FBMkJ1RCxPQUEzQixFQUFvQ1csUUFBcEM7QUFDQSxhQUFLaEUsUUFBTCxHQUFnQixJQUFoQjtBQUNBLGFBQUs0RSxZQUFMO0FBQ0Q7QUFDRixLQVBELE1BT08sSUFBSSxLQUFLMUUsZUFBTCxDQUFxQjJELE9BQXJCLElBQWdDRyxTQUFTSixHQUFULEtBQWlCLEdBQWpELElBQXdEUCxXQUFXLEtBQUtuRCxlQUFMLENBQXFCMkQsT0FBNUYsRUFBcUc7QUFDMUc7QUFDQSxXQUFLM0QsZUFBTCxDQUFxQjJELE9BQXJCLENBQTZCUixPQUE3QixFQUFzQ3NCLElBQXRDLENBQTJDWCxRQUEzQztBQUNELEtBSE0sTUFHQSxJQUFJQSxTQUFTSixHQUFULEtBQWlCLEdBQWpCLElBQXdCUCxXQUFXLEtBQUt2RCxxQkFBNUMsRUFBbUU7QUFDeEU7QUFDQSxXQUFLQSxxQkFBTCxDQUEyQnVELE9BQTNCLEVBQW9DVyxRQUFwQztBQUNELEtBSE0sTUFHQSxJQUFJQSxTQUFTSixHQUFULEtBQWlCLEtBQUsxRCxlQUFMLENBQXFCMEQsR0FBMUMsRUFBK0M7QUFDcEQ7QUFDQSxVQUFJLEtBQUsxRCxlQUFMLENBQXFCMkQsT0FBckIsSUFBZ0NRLE9BQU9DLElBQVAsQ0FBWSxLQUFLcEUsZUFBTCxDQUFxQjJELE9BQWpDLEVBQTBDQyxNQUE5RSxFQUFzRjtBQUNwRkUsaUJBQVNILE9BQVQsR0FBbUIsS0FBSzNELGVBQUwsQ0FBcUIyRCxPQUF4QztBQUNEO0FBQ0QsV0FBSzNELGVBQUwsQ0FBcUJ1QyxRQUFyQixDQUE4QnVCLFFBQTlCO0FBQ0EsV0FBS2hFLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxXQUFLNEUsWUFBTDtBQUNEO0FBQ0Y7O0FBRUQ7OztBQUdBQSxpQkFBZ0I7QUFDZCxRQUFJLENBQUMsS0FBSzdFLFlBQUwsQ0FBa0IrRCxNQUF2QixFQUErQjtBQUM3QixhQUFPLEtBQUs4RCxVQUFMLEVBQVA7QUFDRDtBQUNELFNBQUtQLFVBQUw7O0FBRUE7QUFDQSxTQUFLUSxhQUFMLEdBQXFCLEtBQXJCOztBQUVBLFFBQUl4RSxVQUFVLEtBQUt0RCxZQUFMLENBQWtCLENBQWxCLENBQWQ7QUFDQSxRQUFJLE9BQU9zRCxRQUFReUUsUUFBZixLQUE0QixVQUFoQyxFQUE0QztBQUMxQztBQUNBLFVBQUlDLFVBQVUxRSxPQUFkO0FBQ0EsVUFBSXlFLFdBQVdDLFFBQVFELFFBQXZCO0FBQ0EsYUFBT0MsUUFBUUQsUUFBZjs7QUFFQTtBQUNBLFdBQUtELGFBQUwsR0FBcUIsSUFBckI7O0FBRUE7QUFDQUMsZUFBU0MsT0FBVCxFQUFrQmpGLElBQWxCLENBQXVCLE1BQU07QUFDM0I7QUFDQSxZQUFJLEtBQUsrRSxhQUFULEVBQXdCO0FBQ3RCO0FBQ0EsZUFBS2pELFlBQUw7QUFDRDtBQUNGLE9BTkQsRUFNRzdCLEtBTkgsQ0FNVWhCLEdBQUQsSUFBUztBQUNoQjtBQUNBO0FBQ0EsWUFBSVMsR0FBSjtBQUNBLGNBQU1nQyxRQUFRLEtBQUt6RSxZQUFMLENBQWtCbUUsT0FBbEIsQ0FBMEI2RCxPQUExQixDQUFkO0FBQ0EsWUFBSXZELFNBQVMsQ0FBYixFQUFnQjtBQUNkaEMsZ0JBQU0sS0FBS3pDLFlBQUwsQ0FBa0IyRSxNQUFsQixDQUF5QkYsS0FBekIsRUFBZ0MsQ0FBaEMsRUFBbUMsQ0FBbkMsQ0FBTjtBQUNEO0FBQ0QsWUFBSWhDLE9BQU9BLElBQUlDLFFBQWYsRUFBeUI7QUFDdkJELGNBQUlDLFFBQUosQ0FBYVYsR0FBYjtBQUNBLGVBQUsvQixRQUFMLEdBQWdCLElBQWhCO0FBQ0EsZUFBSzhGLHNCQUFMLENBQTRCLEtBQUtDLHNCQUFMLEVBQTVCLEVBSHVCLENBR29DO0FBQzNELGVBQUtuQixZQUFMLEdBSnVCLENBSUg7QUFDckI7QUFDRixPQXBCRDtBQXFCQTtBQUNEOztBQUVELFNBQUs1RSxRQUFMLEdBQWdCLEtBQWhCO0FBQ0EsU0FBS0UsZUFBTCxHQUF1QixLQUFLSCxZQUFMLENBQWtCbUgsS0FBbEIsRUFBdkI7O0FBRUEsUUFBSTtBQUNGLFdBQUtoSCxlQUFMLENBQXFCK0IsSUFBckIsR0FBNEIsa0NBQVMsS0FBSy9CLGVBQUwsQ0FBcUJpRCxPQUE5QixFQUF1QyxJQUF2QyxDQUE1QjtBQUNBLFdBQUt5QyxNQUFMLENBQVk2QixLQUFaLENBQWtCLElBQWxCLEVBQXdCLE1BQU0sa0NBQVMsS0FBS3ZILGVBQUwsQ0FBcUJpRCxPQUE5QixFQUF1QyxLQUF2QyxFQUE4QyxJQUE5QyxDQUE5QixFQUZFLENBRWlGO0FBQ3BGLEtBSEQsQ0FHRSxPQUFPbkIsQ0FBUCxFQUFVO0FBQ1YsV0FBSzRELE1BQUwsQ0FBWXZELEtBQVosQ0FBa0IsK0JBQWxCLEVBQW1ELEtBQUtuQyxlQUFMLENBQXFCaUQsT0FBeEU7QUFDQSxhQUFPLEtBQUt6QixRQUFMLENBQWMsSUFBSUMsS0FBSixDQUFVLCtCQUFWLENBQWQsQ0FBUDtBQUNEOztBQUVELFFBQUlNLE9BQU8sS0FBSy9CLGVBQUwsQ0FBcUIrQixJQUFyQixDQUEwQmlGLEtBQTFCLEVBQVg7O0FBRUEsU0FBS2hDLElBQUwsQ0FBVWpELFFBQVEsQ0FBQyxLQUFLL0IsZUFBTCxDQUFxQitCLElBQXJCLENBQTBCNkIsTUFBM0IsR0FBb0N4RixHQUFwQyxHQUEwQyxFQUFsRCxDQUFWO0FBQ0EsV0FBTyxLQUFLMEosU0FBWjtBQUNEOztBQUVEOzs7QUFHQUosZUFBYztBQUNabEYsaUJBQWEsS0FBS3ZDLFVBQWxCO0FBQ0EsU0FBS0EsVUFBTCxHQUFrQnNGLFdBQVcsTUFBTyxLQUFLN0UsTUFBTCxJQUFlLEtBQUtBLE1BQUwsRUFBakMsRUFBaUQsS0FBS3BCLGdCQUF0RCxDQUFsQjtBQUNEOztBQUVEOzs7QUFHQTZILGVBQWM7QUFDWjNFLGlCQUFhLEtBQUt2QyxVQUFsQjtBQUNBLFNBQUtBLFVBQUwsR0FBa0IsSUFBbEI7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkF1SCxtQkFBa0IxRCxRQUFsQixFQUE0QjtBQUMxQixRQUFJWCxVQUFVLG1CQUFPLEVBQVAsRUFBVyxTQUFYLEVBQXNCVyxRQUF0QixFQUFnQ04sV0FBaEMsR0FBOENDLElBQTlDLEVBQWQ7O0FBRUE7QUFDQSxRQUFJLENBQUNLLFFBQUQsSUFBYSxDQUFDQSxTQUFTaUUsVUFBdkIsSUFBcUMsQ0FBQ2pFLFNBQVNpRSxVQUFULENBQW9CbkUsTUFBOUQsRUFBc0U7QUFDcEU7QUFDRDs7QUFFRDtBQUNBLFFBQUlFLFNBQVNKLEdBQVQsS0FBaUIsR0FBakIsSUFBd0IsUUFBUXNFLElBQVIsQ0FBYWxFLFNBQVNYLE9BQXRCLENBQXhCLElBQTBEVyxTQUFTaUUsVUFBVCxDQUFvQixDQUFwQixFQUF1QkUsSUFBdkIsS0FBZ0MsTUFBOUYsRUFBc0c7QUFDcEduRSxlQUFTb0UsRUFBVCxHQUFjakMsT0FBT25DLFNBQVNYLE9BQWhCLENBQWQ7QUFDQVcsZUFBU1gsT0FBVCxHQUFtQixDQUFDVyxTQUFTaUUsVUFBVCxDQUFvQmYsS0FBcEIsR0FBNEJtQixLQUE1QixJQUFxQyxFQUF0QyxFQUEwQzVFLFFBQTFDLEdBQXFEQyxXQUFyRCxHQUFtRUMsSUFBbkUsRUFBbkI7QUFDRDs7QUFFRDtBQUNBLFFBQUksQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEtBQWIsRUFBb0IsS0FBcEIsRUFBMkIsU0FBM0IsRUFBc0NPLE9BQXRDLENBQThDYixPQUE5QyxJQUF5RCxDQUE3RCxFQUFnRTtBQUM5RDtBQUNEOztBQUVEO0FBQ0EsUUFBSVcsU0FBU2lFLFVBQVQsQ0FBb0JqRSxTQUFTaUUsVUFBVCxDQUFvQm5FLE1BQXBCLEdBQTZCLENBQWpELEVBQW9EcUUsSUFBcEQsS0FBNkQsTUFBakUsRUFBeUU7QUFDdkVuRSxlQUFTRyxhQUFULEdBQXlCSCxTQUFTaUUsVUFBVCxDQUFvQmpFLFNBQVNpRSxVQUFULENBQW9CbkUsTUFBcEIsR0FBNkIsQ0FBakQsRUFBb0R1RSxLQUE3RTtBQUNEOztBQUVEO0FBQ0EsUUFBSXJFLFNBQVNpRSxVQUFULENBQW9CLENBQXBCLEVBQXVCRSxJQUF2QixLQUFnQyxNQUFoQyxJQUEwQ25FLFNBQVNpRSxVQUFULENBQW9CLENBQXBCLEVBQXVCSyxPQUFyRSxFQUE4RTtBQUM1RSxZQUFNQyxTQUFTdkUsU0FBU2lFLFVBQVQsQ0FBb0IsQ0FBcEIsRUFBdUJLLE9BQXZCLENBQStCL0UsR0FBL0IsQ0FBb0NnQixHQUFELElBQVM7QUFDekQsWUFBSSxDQUFDQSxHQUFMLEVBQVU7QUFDUjtBQUNEO0FBQ0QsWUFBSWlFLE1BQU1DLE9BQU4sQ0FBY2xFLEdBQWQsQ0FBSixFQUF3QjtBQUN0QixpQkFBT0EsSUFBSWhCLEdBQUosQ0FBU2dCLEdBQUQsSUFBUyxDQUFDQSxJQUFJOEQsS0FBSixJQUFhLEVBQWQsRUFBa0I1RSxRQUFsQixHQUE2QkUsSUFBN0IsRUFBakIsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPLENBQUNZLElBQUk4RCxLQUFKLElBQWEsRUFBZCxFQUFrQjVFLFFBQWxCLEdBQTZCQyxXQUE3QixHQUEyQ0MsSUFBM0MsRUFBUDtBQUNEO0FBQ0YsT0FUYyxDQUFmOztBQVdBLFlBQU1ZLE1BQU1nRSxPQUFPckIsS0FBUCxFQUFaO0FBQ0FsRCxlQUFTSSxJQUFULEdBQWdCRyxHQUFoQjs7QUFFQSxVQUFJZ0UsT0FBT3pFLE1BQVAsS0FBa0IsQ0FBdEIsRUFBeUI7QUFDdkJFLGlCQUFTTyxJQUFJbUUsV0FBSixFQUFULElBQThCSCxPQUFPLENBQVAsQ0FBOUI7QUFDRCxPQUZELE1BRU8sSUFBSUEsT0FBT3pFLE1BQVAsR0FBZ0IsQ0FBcEIsRUFBdUI7QUFDNUJFLGlCQUFTTyxJQUFJbUUsV0FBSixFQUFULElBQThCSCxNQUE5QjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7O0FBTUF0RSxVQUFTb0UsS0FBVCxFQUFnQjtBQUNkLFdBQU8sQ0FBQyxDQUFDaEUsT0FBT3NFLFNBQVAsQ0FBaUJsRixRQUFqQixDQUEwQm1GLElBQTFCLENBQStCUCxLQUEvQixFQUFzQ1EsS0FBdEMsQ0FBNEMsVUFBNUMsQ0FBVDtBQUNEOztBQUVEOztBQUVBOzs7QUFHQUMsc0JBQXFCO0FBQ25CLFNBQUtDLGFBQUwsR0FBcUIsS0FBSzVILE1BQUwsQ0FBWVMsTUFBakM7QUFDQSxTQUFLdkIsVUFBTCxHQUFrQixJQUFsQjs7QUFFQSxRQUFJLE9BQU8ySSxNQUFQLEtBQWtCLFdBQWxCLElBQWlDQSxPQUFPQyxNQUE1QyxFQUFvRDtBQUNsRCxXQUFLQyxrQkFBTCxHQUEwQixJQUFJRCxNQUFKLENBQVdFLElBQUlDLGVBQUosQ0FBb0IsSUFBSUMsSUFBSixDQUFTLENBQUNDLGVBQUQsQ0FBVCxDQUFwQixDQUFYLENBQTFCO0FBQ0EsV0FBS0osa0JBQUwsQ0FBd0JLLFNBQXhCLEdBQXFDdkgsQ0FBRCxJQUFPO0FBQ3pDLFlBQUlFLFVBQVVGLEVBQUVDLElBQUYsQ0FBT0MsT0FBckI7QUFDQSxZQUFJRCxPQUFPRCxFQUFFQyxJQUFGLENBQU9tRCxNQUFsQjs7QUFFQSxnQkFBUWxELE9BQVI7QUFDRSxlQUFLL0QsMkJBQUw7QUFDRSxpQkFBSzRLLGFBQUwsQ0FBbUIsRUFBRTlHLElBQUYsRUFBbkI7QUFDQTs7QUFFRixlQUFLNUQsMkJBQUw7QUFDRSxpQkFBSzJKLFNBQUwsR0FBaUIsS0FBSzdHLE1BQUwsQ0FBWStELElBQVosQ0FBaUJqRCxJQUFqQixDQUFqQjtBQUNBO0FBUEo7QUFTRCxPQWJEOztBQWVBLFdBQUtpSCxrQkFBTCxDQUF3QnhJLE9BQXhCLEdBQW1Dc0IsQ0FBRCxJQUFPO0FBQ3ZDLGFBQUtOLFFBQUwsQ0FBYyxJQUFJQyxLQUFKLENBQVUsNENBQTRDSyxFQUFFRSxPQUF4RCxDQUFkO0FBQ0QsT0FGRDs7QUFJQSxXQUFLZ0gsa0JBQUwsQ0FBd0JNLFdBQXhCLENBQW9DQyxjQUFjeEwseUJBQWQsQ0FBcEM7QUFDRCxLQXRCRCxNQXNCTztBQUNMLFlBQU15TCxnQkFBaUJ0RSxNQUFELElBQVk7QUFBRSxhQUFLMkQsYUFBTCxDQUFtQixFQUFFOUcsTUFBTW1ELE1BQVIsRUFBbkI7QUFBc0MsT0FBMUU7QUFDQSxZQUFNdUUsZ0JBQWlCdkUsTUFBRCxJQUFZO0FBQUUsYUFBSzRDLFNBQUwsR0FBaUIsS0FBSzdHLE1BQUwsQ0FBWStELElBQVosQ0FBaUJFLE1BQWpCLENBQWpCO0FBQTJDLE9BQS9FO0FBQ0EsV0FBS3dFLFlBQUwsR0FBb0IsSUFBSUMscUJBQUosQ0FBZ0JILGFBQWhCLEVBQStCQyxhQUEvQixDQUFwQjtBQUNEOztBQUVEO0FBQ0EsU0FBS3hJLE1BQUwsQ0FBWVMsTUFBWixHQUFzQkMsR0FBRCxJQUFTO0FBQzVCLFVBQUksQ0FBQyxLQUFLeEIsVUFBVixFQUFzQjtBQUNwQjtBQUNEOztBQUVELFVBQUksS0FBSzZJLGtCQUFULEVBQTZCO0FBQzNCLGFBQUtBLGtCQUFMLENBQXdCTSxXQUF4QixDQUFvQ0MsY0FBY3ZMLGVBQWQsRUFBK0IyRCxJQUFJSSxJQUFuQyxDQUFwQyxFQUE4RSxDQUFDSixJQUFJSSxJQUFMLENBQTlFO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsYUFBSzJILFlBQUwsQ0FBa0JFLE9BQWxCLENBQTBCakksSUFBSUksSUFBOUI7QUFDRDtBQUNGLEtBVkQ7QUFXRDs7QUFFRDs7O0FBR0FVLHdCQUF1QjtBQUNyQixRQUFJLENBQUMsS0FBS3RDLFVBQVYsRUFBc0I7QUFDcEI7QUFDRDs7QUFFRCxTQUFLQSxVQUFMLEdBQWtCLEtBQWxCO0FBQ0EsU0FBS2MsTUFBTCxDQUFZUyxNQUFaLEdBQXFCLEtBQUttSCxhQUExQjtBQUNBLFNBQUtBLGFBQUwsR0FBcUIsSUFBckI7O0FBRUEsUUFBSSxLQUFLRyxrQkFBVCxFQUE2QjtBQUMzQjtBQUNBLFdBQUtBLGtCQUFMLENBQXdCYSxTQUF4QjtBQUNBLFdBQUtiLGtCQUFMLEdBQTBCLElBQTFCO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7QUFLQXhELGtCQUFpQk4sTUFBakIsRUFBeUI7QUFDdkI7QUFDQSxRQUFJLEtBQUs4RCxrQkFBVCxFQUE2QjtBQUMzQixXQUFLQSxrQkFBTCxDQUF3Qk0sV0FBeEIsQ0FBb0NDLGNBQWNyTCxlQUFkLEVBQStCZ0gsTUFBL0IsQ0FBcEMsRUFBNEUsQ0FBQ0EsTUFBRCxDQUE1RTtBQUNELEtBRkQsTUFFTztBQUNMLFdBQUt3RSxZQUFMLENBQWtCSSxPQUFsQixDQUEwQjVFLE1BQTFCO0FBQ0Q7QUFDRjtBQTF3QnVCOztrQkFBTGpHLEk7QUE2d0JyQixNQUFNc0ssZ0JBQWdCLENBQUN2SCxPQUFELEVBQVVrRCxNQUFWLE1BQXNCLEVBQUVsRCxPQUFGLEVBQVdrRCxNQUFYLEVBQXRCLENBQXRCIiwiZmlsZSI6ImltYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9wT3IgfSBmcm9tICdyYW1kYSdcbmltcG9ydCBUQ1BTb2NrZXQgZnJvbSAnZW1haWxqcy10Y3Atc29ja2V0J1xuaW1wb3J0IHsgdG9UeXBlZEFycmF5LCBmcm9tVHlwZWRBcnJheSB9IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0IHsgcGFyc2VyLCBjb21waWxlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IENvbXByZXNzaW9uIGZyb20gJy4vY29tcHJlc3Npb24nXG5pbXBvcnQgQ29tcHJlc3Npb25CbG9iIGZyb20gJy4uL3Jlcy9jb21wcmVzc2lvbi53b3JrZXIuYmxvYidcblxuLy9cbi8vIGNvbnN0YW50cyB1c2VkIGZvciBjb21tdW5pY2F0aW9uIHdpdGggdGhlIHdvcmtlclxuLy9cbmNvbnN0IE1FU1NBR0VfSU5JVElBTElaRV9XT1JLRVIgPSAnc3RhcnQnXG5jb25zdCBNRVNTQUdFX0lORkxBVEUgPSAnaW5mbGF0ZSdcbmNvbnN0IE1FU1NBR0VfSU5GTEFURURfREFUQV9SRUFEWSA9ICdpbmZsYXRlZF9yZWFkeSdcbmNvbnN0IE1FU1NBR0VfREVGTEFURSA9ICdkZWZsYXRlJ1xuY29uc3QgTUVTU0FHRV9ERUZMQVRFRF9EQVRBX1JFQURZID0gJ2RlZmxhdGVkX3JlYWR5J1xuXG5jb25zdCBFT0wgPSAnXFxyXFxuJ1xuY29uc3QgTElORV9GRUVEID0gMTBcbmNvbnN0IENBUlJJQUdFX1JFVFVSTiA9IDEzXG5jb25zdCBMRUZUX0NVUkxZX0JSQUNLRVQgPSAxMjNcbmNvbnN0IFJJR0hUX0NVUkxZX0JSQUNLRVQgPSAxMjVcblxuY29uc3QgQVNDSUlfUExVUyA9IDQzXG5cbi8vIFN0YXRlIHRyYWNraW5nIHdoZW4gY29uc3RydWN0aW5nIGFuIElNQVAgY29tbWFuZCBmcm9tIGJ1ZmZlcnMuXG5jb25zdCBCVUZGRVJfU1RBVEVfTElURVJBTCA9ICdsaXRlcmFsJ1xuY29uc3QgQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzEgPSAnbGl0ZXJhbF9sZW5ndGhfMSdcbmNvbnN0IEJVRkZFUl9TVEFURV9QT1NTSUJMWV9MSVRFUkFMX0xFTkdUSF8yID0gJ2xpdGVyYWxfbGVuZ3RoXzInXG5jb25zdCBCVUZGRVJfU1RBVEVfREVGQVVMVCA9ICdkZWZhdWx0J1xuXG4vKipcbiAqIEhvdyBtdWNoIHRpbWUgdG8gd2FpdCBzaW5jZSB0aGUgbGFzdCByZXNwb25zZSB1bnRpbCB0aGUgY29ubmVjdGlvbiBpcyBjb25zaWRlcmVkIGlkbGluZ1xuICovXG5jb25zdCBUSU1FT1VUX0VOVEVSX0lETEUgPSAxMDAwXG5cbi8qKlxuICogTG93ZXIgQm91bmQgZm9yIHNvY2tldCB0aW1lb3V0IHRvIHdhaXQgc2luY2UgdGhlIGxhc3QgZGF0YSB3YXMgd3JpdHRlbiB0byBhIHNvY2tldFxuICovXG5jb25zdCBUSU1FT1VUX1NPQ0tFVF9MT1dFUl9CT1VORCA9IDEwMDAwXG5cbi8qKlxuICogTXVsdGlwbGllciBmb3Igc29ja2V0IHRpbWVvdXQ6XG4gKlxuICogV2UgYXNzdW1lIGF0IGxlYXN0IGEgR1BSUyBjb25uZWN0aW9uIHdpdGggMTE1IGtiL3MgPSAxNCwzNzUga0IvcyB0b3BzLCBzbyAxMCBLQi9zIHRvIGJlIG9uXG4gKiB0aGUgc2FmZSBzaWRlLiBXZSBjYW4gdGltZW91dCBhZnRlciBhIGxvd2VyIGJvdW5kIG9mIDEwcyArIChuIEtCIC8gMTAgS0IvcykuIEEgMSBNQiBtZXNzYWdlXG4gKiB1cGxvYWQgd291bGQgYmUgMTEwIHNlY29uZHMgdG8gd2FpdCBmb3IgdGhlIHRpbWVvdXQuIDEwIEtCL3MgPT09IDAuMSBzL0JcbiAqL1xuY29uc3QgVElNRU9VVF9TT0NLRVRfTVVMVElQTElFUiA9IDAuMVxuXG4vKipcbiAqIENyZWF0ZXMgYSBjb25uZWN0aW9uIG9iamVjdCB0byBhbiBJTUFQIHNlcnZlci4gQ2FsbCBgY29ubmVjdGAgbWV0aG9kIHRvIGluaXRpdGF0ZVxuICogdGhlIGFjdHVhbCBjb25uZWN0aW9uLCB0aGUgY29uc3RydWN0b3Igb25seSBkZWZpbmVzIHRoZSBwcm9wZXJ0aWVzIGJ1dCBkb2VzIG5vdCBhY3R1YWxseSBjb25uZWN0LlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBbaG9zdD0nbG9jYWxob3N0J10gSG9zdG5hbWUgdG8gY29uZW5jdCB0b1xuICogQHBhcmFtIHtOdW1iZXJ9IFtwb3J0PTE0M10gUG9ydCBudW1iZXIgdG8gY29ubmVjdCB0b1xuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25hbCBvcHRpb25zIG9iamVjdFxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnRdIFNldCB0byB0cnVlLCB0byB1c2UgZW5jcnlwdGVkIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5jb21wcmVzc2lvbldvcmtlclBhdGhdIG9mZmxvYWRzIGRlLS9jb21wcmVzc2lvbiBjb21wdXRhdGlvbiB0byBhIHdlYiB3b3JrZXIsIHRoaXMgaXMgdGhlIHBhdGggdG8gdGhlIGJyb3dzZXJpZmllZCBlbWFpbGpzLWNvbXByZXNzb3Itd29ya2VyLmpzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEltYXAge1xuICBjb25zdHJ1Y3RvciAoaG9zdCwgcG9ydCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy50aW1lb3V0RW50ZXJJZGxlID0gVElNRU9VVF9FTlRFUl9JRExFXG4gICAgdGhpcy50aW1lb3V0U29ja2V0TG93ZXJCb3VuZCA9IFRJTUVPVVRfU09DS0VUX0xPV0VSX0JPVU5EXG4gICAgdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllciA9IFRJTUVPVVRfU09DS0VUX01VTFRJUExJRVJcblxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcblxuICAgIHRoaXMucG9ydCA9IHBvcnQgfHwgKHRoaXMub3B0aW9ucy51c2VTZWN1cmVUcmFuc3BvcnQgPyA5OTMgOiAxNDMpXG4gICAgdGhpcy5ob3N0ID0gaG9zdCB8fCAnbG9jYWxob3N0J1xuXG4gICAgLy8gVXNlIGEgVExTIGNvbm5lY3Rpb24uIFBvcnQgOTkzIGFsc28gZm9yY2VzIFRMUy5cbiAgICB0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0ID0gJ3VzZVNlY3VyZVRyYW5zcG9ydCcgaW4gdGhpcy5vcHRpb25zID8gISF0aGlzLm9wdGlvbnMudXNlU2VjdXJlVHJhbnNwb3J0IDogdGhpcy5wb3J0ID09PSA5OTNcblxuICAgIHRoaXMuc2VjdXJlTW9kZSA9ICEhdGhpcy5vcHRpb25zLnVzZVNlY3VyZVRyYW5zcG9ydCAvLyBEb2VzIHRoZSBjb25uZWN0aW9uIHVzZSBTU0wvVExTXG5cbiAgICB0aGlzLl9jb25uZWN0aW9uUmVhZHkgPSBmYWxzZSAvLyBJcyB0aGUgY29uZWN0aW9uIGVzdGFibGlzaGVkIGFuZCBncmVldGluZyBpcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXJcblxuICAgIHRoaXMuX2dsb2JhbEFjY2VwdFVudGFnZ2VkID0ge30gLy8gR2xvYmFsIGhhbmRsZXJzIGZvciB1bnJlbGF0ZWQgcmVzcG9uc2VzIChFWFBVTkdFLCBFWElTVFMgZXRjLilcblxuICAgIHRoaXMuX2NsaWVudFF1ZXVlID0gW10gLy8gUXVldWUgb2Ygb3V0Z29pbmcgY29tbWFuZHNcbiAgICB0aGlzLl9jYW5TZW5kID0gZmFsc2UgLy8gSXMgaXQgT0sgdG8gc2VuZCBzb21ldGhpbmcgdG8gdGhlIHNlcnZlclxuICAgIHRoaXMuX3RhZ0NvdW50ZXIgPSAwIC8vIENvdW50ZXIgdG8gYWxsb3cgdW5pcXVldWUgaW1hcCB0YWdzXG4gICAgdGhpcy5fY3VycmVudENvbW1hbmQgPSBmYWxzZSAvLyBDdXJyZW50IGNvbW1hbmQgdGhhdCBpcyB3YWl0aW5nIGZvciByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXJcblxuICAgIHRoaXMuX2lkbGVUaW1lciA9IGZhbHNlIC8vIFRpbWVyIHdhaXRpbmcgdG8gZW50ZXIgaWRsZVxuICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IGZhbHNlIC8vIFRpbWVyIHdhaXRpbmcgdG8gZGVjbGFyZSB0aGUgc29ja2V0IGRlYWQgc3RhcnRpbmcgZnJvbSB0aGUgbGFzdCB3cml0ZVxuXG4gICAgdGhpcy5jb21wcmVzc2VkID0gZmFsc2UgLy8gSXMgdGhlIGNvbm5lY3Rpb24gY29tcHJlc3NlZCBhbmQgbmVlZHMgaW5mbGF0aW5nL2RlZmxhdGluZ1xuXG4gICAgLy9cbiAgICAvLyBIRUxQRVJTXG4gICAgLy9cblxuICAgIC8vIEFzIHRoZSBzZXJ2ZXIgc2VuZHMgZGF0YSBpbiBjaHVua3MsIGl0IG5lZWRzIHRvIGJlIHNwbGl0IGludG8gc2VwYXJhdGUgbGluZXMuIEhlbHBzIHBhcnNpbmcgdGhlIGlucHV0LlxuICAgIHRoaXMuX2luY29taW5nQnVmZmVycyA9IFtdXG4gICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgPSAwXG5cbiAgICAvL1xuICAgIC8vIEV2ZW50IHBsYWNlaG9sZGVycywgbWF5IGJlIG92ZXJyaWRlbiB3aXRoIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAgIC8vXG4gICAgdGhpcy5vbmNlcnQgPSBudWxsXG4gICAgdGhpcy5vbmVycm9yID0gbnVsbCAvLyBJcnJlY292ZXJhYmxlIGVycm9yIG9jY3VycmVkLiBDb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgd2lsbCBiZSBjbG9zZWQgYXV0b21hdGljYWxseS5cbiAgICB0aGlzLm9ucmVhZHkgPSBudWxsIC8vIFRoZSBjb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgaGFzIGJlZW4gZXN0YWJsaXNoZWQgYW5kIGdyZWV0aW5nIGlzIHJlY2VpdmVkXG4gICAgdGhpcy5vbmlkbGUgPSBudWxsIC8vIFRoZXJlIGFyZSBubyBtb3JlIGNvbW1hbmRzIHRvIHByb2Nlc3NcbiAgfVxuXG4gIC8vIFBVQkxJQyBNRVRIT0RTXG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyLiBXYWl0IGZvciBvbnJlYWR5IGV2ZW50XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBTb2NrZXRcbiAgICogICAgIFRFU1RJTkcgT05MWSEgVGhlIFRDUFNvY2tldCBoYXMgYSBwcmV0dHkgbm9uc2Vuc2ljYWwgY29udmVuaWVuY2UgY29uc3RydWN0b3IsXG4gICAqICAgICB3aGljaCBtYWtlcyBpdCBoYXJkIHRvIG1vY2suIEZvciBkZXBlbmRlbmN5LWluamVjdGlvbiBwdXJwb3Nlcywgd2UgdXNlIHRoZVxuICAgKiAgICAgU29ja2V0IHBhcmFtZXRlciB0byBwYXNzIGluIGEgbW9jayBTb2NrZXQgaW1wbGVtZW50YXRpb24uIFNob3VsZCBiZSBsZWZ0IGJsYW5rXG4gICAqICAgICBpbiBwcm9kdWN0aW9uIHVzZSFcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gc29ja2V0IGlzIG9wZW5lZFxuICAgKi9cbiAgY29ubmVjdCAoU29ja2V0ID0gVENQU29ja2V0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0ID0gU29ja2V0Lm9wZW4odGhpcy5ob3N0LCB0aGlzLnBvcnQsIHtcbiAgICAgICAgYmluYXJ5VHlwZTogJ2FycmF5YnVmZmVyJyxcbiAgICAgICAgdXNlU2VjdXJlVHJhbnNwb3J0OiB0aGlzLnNlY3VyZU1vZGUsXG4gICAgICAgIGNhOiB0aGlzLm9wdGlvbnMuY2FcbiAgICAgIH0pXG5cbiAgICAgIC8vIGFsbG93cyBjZXJ0aWZpY2F0ZSBoYW5kbGluZyBmb3IgcGxhdGZvcm0gdy9vIG5hdGl2ZSB0bHMgc3VwcG9ydFxuICAgICAgLy8gb25jZXJ0IGlzIG5vbiBzdGFuZGFyZCBzbyBzZXR0aW5nIGl0IG1pZ2h0IHRocm93IGlmIHRoZSBzb2NrZXQgb2JqZWN0IGlzIGltbXV0YWJsZVxuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zb2NrZXQub25jZXJ0ID0gKGNlcnQpID0+IHsgdGhpcy5vbmNlcnQgJiYgdGhpcy5vbmNlcnQoY2VydCkgfVxuICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgIC8vIENvbm5lY3Rpb24gY2xvc2luZyB1bmV4cGVjdGVkIGlzIGFuIGVycm9yXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJ1NvY2tldCBjbG9zZWQgdW5leHBlY3RlZGx5IScpKVxuICAgICAgdGhpcy5zb2NrZXQub25kYXRhID0gKGV2dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMuX29uRGF0YShldnQpXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGFuIGVycm9yIGhhcHBlbnMgZHVyaW5nIGNyZWF0ZSB0aW1lLCByZWplY3QgdGhlIHByb21pc2VcbiAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4ge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKCdDb3VsZCBub3Qgb3BlbiBzb2NrZXQ6ICcgKyBlLmRhdGEubWVzc2FnZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgLy8gdXNlIHByb3BlciBcImlycmVjb3ZlcmFibGUgZXJyb3IsIHRlYXIgZG93biBldmVyeXRoaW5nXCItaGFuZGxlciBvbmx5IGFmdGVyIHNvY2tldCBpcyBvcGVuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5fb25FcnJvcihlKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkXG4gICAqL1xuICBjbG9zZSAoZXJyb3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHZhciB0ZWFyRG93biA9ICgpID0+IHtcbiAgICAgICAgLy8gZnVsZmlsbCBwZW5kaW5nIHByb21pc2VzXG4gICAgICAgIHRoaXMuX2NsaWVudFF1ZXVlLmZvckVhY2goY21kID0+IGNtZC5jYWxsYmFjayhlcnJvcikpXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZCkge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmNhbGxiYWNrKGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2xpZW50UXVldWUgPSBbXVxuICAgICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IGZhbHNlXG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lcilcbiAgICAgICAgdGhpcy5faWRsZVRpbWVyID0gbnVsbFxuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIpXG4gICAgICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IG51bGxcblxuICAgICAgICBpZiAodGhpcy5zb2NrZXQpIHtcbiAgICAgICAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gbnVsbFxuICAgICAgICAgIHRoaXMuc29ja2V0Lm9uZGF0YSA9IG51bGxcbiAgICAgICAgICB0aGlzLnNvY2tldC5vbmVycm9yID0gbnVsbFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnNvY2tldC5vbmNlcnQgPSBudWxsXG4gICAgICAgICAgfSBjYXRjaCAoRSkgeyB9XG5cbiAgICAgICAgICB0aGlzLnNvY2tldCA9IG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9kaXNhYmxlQ29tcHJlc3Npb24oKVxuXG4gICAgICBpZiAoIXRoaXMuc29ja2V0IHx8IHRoaXMuc29ja2V0LnJlYWR5U3RhdGUgIT09ICdvcGVuJykge1xuICAgICAgICByZXR1cm4gdGVhckRvd24oKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNvY2tldC5vbmNsb3NlID0gdGhpcy5zb2NrZXQub25lcnJvciA9IHRlYXJEb3duIC8vIHdlIGRvbid0IHJlYWxseSBjYXJlIGFib3V0IHRoZSBlcnJvciBoZXJlXG4gICAgICB0aGlzLnNvY2tldC5jbG9zZSgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIExPR09VVCB0byB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBVc2UgaXMgZGlzY291cmFnZWQhXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIGNvbm5lY3Rpb24gaXMgY2xvc2VkIGJ5IHNlcnZlci5cbiAgICovXG4gIGxvZ291dCAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSB0aGlzLnNvY2tldC5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCdDbGllbnQgbG9nZ2luZyBvdXQnKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbnF1ZXVlQ29tbWFuZCgnTE9HT1VUJylcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBUTFMgaGFuZHNoYWtlXG4gICAqL1xuICB1cGdyYWRlICgpIHtcbiAgICB0aGlzLnNlY3VyZU1vZGUgPSB0cnVlXG4gICAgdGhpcy5zb2NrZXQudXBncmFkZVRvU2VjdXJlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgYSBjb21tYW5kIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlci5cbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbWFpbGpzL2VtYWlsanMtaW1hcC1oYW5kbGVyIGZvciByZXF1ZXN0IHN0cnVjdHVyZS5cbiAgICogRG8gbm90IHByb3ZpZGUgYSB0YWcgcHJvcGVydHksIGl0IHdpbGwgYmUgc2V0IGJ5IHRoZSBxdWV1ZSBtYW5hZ2VyLlxuICAgKlxuICAgKiBUbyBjYXRjaCB1bnRhZ2dlZCByZXNwb25zZXMgdXNlIGFjY2VwdFVudGFnZ2VkIHByb3BlcnR5LiBGb3IgZXhhbXBsZSwgaWZcbiAgICogdGhlIHZhbHVlIGZvciBpdCBpcyAnRkVUQ0gnIHRoZW4gdGhlIHJlcG9uc2UgaW5jbHVkZXMgJ3BheWxvYWQuRkVUQ0gnIHByb3BlcnR5XG4gICAqIHRoYXQgaXMgYW4gYXJyYXkgaW5jbHVkaW5nIGFsbCBsaXN0ZWQgKiBGRVRDSCByZXNwb25zZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IFN0cnVjdHVyZWQgcmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheX0gYWNjZXB0VW50YWdnZWQgYSBsaXN0IG9mIHVudGFnZ2VkIHJlc3BvbnNlcyB0aGF0IHdpbGwgYmUgaW5jbHVkZWQgaW4gJ3BheWxvYWQnIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgZGF0YSBmb3IgdGhlIGNvbW1hbmQgcGF5bG9hZFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkXG4gICAqL1xuICBlbnF1ZXVlQ29tbWFuZCAocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXF1ZXN0ID0ge1xuICAgICAgICBjb21tYW5kOiByZXF1ZXN0XG4gICAgICB9XG4gICAgfVxuXG4gICAgYWNjZXB0VW50YWdnZWQgPSBbXS5jb25jYXQoYWNjZXB0VW50YWdnZWQgfHwgW10pLm1hcCgodW50YWdnZWQpID0+ICh1bnRhZ2dlZCB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcblxuICAgIHZhciB0YWcgPSAnVycgKyAoKyt0aGlzLl90YWdDb3VudGVyKVxuICAgIHJlcXVlc3QudGFnID0gdGFnXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIHRhZzogdGFnLFxuICAgICAgICByZXF1ZXN0OiByZXF1ZXN0LFxuICAgICAgICBwYXlsb2FkOiBhY2NlcHRVbnRhZ2dlZC5sZW5ndGggPyB7fSA6IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsbGJhY2s6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlzRXJyb3IocmVzcG9uc2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgIH0gZWxzZSBpZiAoWydOTycsICdCQUQnXS5pbmRleE9mKHByb3BPcignJywgJ2NvbW1hbmQnLCByZXNwb25zZSkudG9VcHBlckNhc2UoKS50cmltKCkpID49IDApIHtcbiAgICAgICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcihyZXNwb25zZS5odW1hblJlYWRhYmxlIHx8ICdFcnJvcicpXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuY29kZSkge1xuICAgICAgICAgICAgICBlcnJvci5jb2RlID0gcmVzcG9uc2UuY29kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGx5IGFueSBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGNvbW1hbmRcbiAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMgfHwge30pLmZvckVhY2goKGtleSkgPT4geyBkYXRhW2tleV0gPSBvcHRpb25zW2tleV0gfSlcblxuICAgICAgYWNjZXB0VW50YWdnZWQuZm9yRWFjaCgoY29tbWFuZCkgPT4geyBkYXRhLnBheWxvYWRbY29tbWFuZF0gPSBbXSB9KVxuXG4gICAgICAvLyBpZiB3ZSdyZSBpbiBwcmlvcml0eSBtb2RlIChpLmUuIHdlIHJhbiBjb21tYW5kcyBpbiBhIHByZWNoZWNrKSxcbiAgICAgIC8vIHF1ZXVlIGFueSBjb21tYW5kcyBCRUZPUkUgdGhlIGNvbW1hbmQgdGhhdCBjb250aWFuZWQgdGhlIHByZWNoZWNrLFxuICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgcXVldWUgY29tbWFuZCBhcyB1c3VhbFxuICAgICAgdmFyIGluZGV4ID0gZGF0YS5jdHggPyB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGRhdGEuY3R4KSA6IC0xXG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkYXRhLnRhZyArPSAnLnAnXG4gICAgICAgIGRhdGEucmVxdWVzdC50YWcgKz0gJy5wJ1xuICAgICAgICB0aGlzLl9jbGllbnRRdWV1ZS5zcGxpY2UoaW5kZXgsIDAsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jbGllbnRRdWV1ZS5wdXNoKGRhdGEpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jYW5TZW5kKSB7XG4gICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBjb21tYW5kc1xuICAgKiBAcGFyYW0gY3R4XG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgZ2V0UHJldmlvdXNseVF1ZXVlZCAoY29tbWFuZHMsIGN0eCkge1xuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGN0eCkgLSAxXG5cbiAgICAvLyBzZWFyY2ggYmFja3dhcmRzIGZvciB0aGUgY29tbWFuZHMgYW5kIHJldHVybiB0aGUgZmlyc3QgZm91bmRcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChpc01hdGNoKHRoaXMuX2NsaWVudFF1ZXVlW2ldKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xpZW50UXVldWVbaV1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhbHNvIGNoZWNrIGN1cnJlbnQgY29tbWFuZCBpZiBubyBTRUxFQ1QgaXMgcXVldWVkXG4gICAgaWYgKGlzTWF0Y2godGhpcy5fY3VycmVudENvbW1hbmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3VycmVudENvbW1hbmRcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcblxuICAgIGZ1bmN0aW9uIGlzTWF0Y2ggKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhICYmIGRhdGEucmVxdWVzdCAmJiBjb21tYW5kcy5pbmRleE9mKGRhdGEucmVxdWVzdC5jb21tYW5kKSA+PSAwXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgZGF0YSB0byB0aGUgVENQIHNvY2tldFxuICAgKiBBcm1zIGEgdGltZW91dCB3YWl0aW5nIGZvciBhIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlci5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBQYXlsb2FkXG4gICAqL1xuICBzZW5kIChzdHIpIHtcbiAgICBjb25zdCBidWZmZXIgPSB0b1R5cGVkQXJyYXkoc3RyKS5idWZmZXJcbiAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy50aW1lb3V0U29ja2V0TG93ZXJCb3VuZCArIE1hdGguZmxvb3IoYnVmZmVyLmJ5dGVMZW5ndGggKiB0aGlzLnRpbWVvdXRTb2NrZXRNdWx0aXBsaWVyKVxuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcikgLy8gY2xlYXIgcGVuZGluZyB0aW1lb3V0c1xuICAgIHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb25FcnJvcihuZXcgRXJyb3IoJyBTb2NrZXQgdGltZWQgb3V0IScpKSwgdGltZW91dCkgLy8gYXJtIHRoZSBuZXh0IHRpbWVvdXRcblxuICAgIGlmICh0aGlzLmNvbXByZXNzZWQpIHtcbiAgICAgIHRoaXMuX3NlbmRDb21wcmVzc2VkKGJ1ZmZlcilcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zb2NrZXQuc2VuZChidWZmZXIpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIGdsb2JhbCBoYW5kbGVyIGZvciBhbiB1bnRhZ2dlZCByZXNwb25zZS4gSWYgY3VycmVudGx5IHByb2Nlc3NlZCBjb21tYW5kXG4gICAqIGhhcyBub3QgbGlzdGVkIHVudGFnZ2VkIGNvbW1hbmQgaXQgaXMgZm9yd2FyZGVkIHRvIHRoZSBnbG9iYWwgaGFuZGxlci4gVXNlZnVsXG4gICAqIHdpdGggRVhQVU5HRSwgRVhJU1RTIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvbW1hbmQgVW50YWdnZWQgY29tbWFuZCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcmVzcG9uc2Ugb2JqZWN0IGFuZCBjb250aW51ZSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgc2V0SGFuZGxlciAoY29tbWFuZCwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZFtjb21tYW5kLnRvVXBwZXJDYXNlKCkudHJpbSgpXSA9IGNhbGxiYWNrXG4gIH1cblxuICAvLyBJTlRFUk5BTCBFVkVOVFNcblxuICAvKipcbiAgICogRXJyb3IgaGFuZGxlciBmb3IgdGhlIHNvY2tldFxuICAgKlxuICAgKiBAZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZ0IEV2ZW50IG9iamVjdC4gU2VlIGV2dC5kYXRhIGZvciB0aGUgZXJyb3JcbiAgICovXG4gIF9vbkVycm9yIChldnQpIHtcbiAgICB2YXIgZXJyb3JcbiAgICBpZiAodGhpcy5pc0Vycm9yKGV2dCkpIHtcbiAgICAgIGVycm9yID0gZXZ0XG4gICAgfSBlbHNlIGlmIChldnQgJiYgdGhpcy5pc0Vycm9yKGV2dC5kYXRhKSkge1xuICAgICAgZXJyb3IgPSBldnQuZGF0YVxuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcigoZXZ0ICYmIGV2dC5kYXRhICYmIGV2dC5kYXRhLm1lc3NhZ2UpIHx8IGV2dC5kYXRhIHx8IGV2dCB8fCAnRXJyb3InKVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yKVxuXG4gICAgLy8gYWx3YXlzIGNhbGwgb25lcnJvciBjYWxsYmFjaywgbm8gbWF0dGVyIGlmIGNsb3NlKCkgc3VjY2VlZHMgb3IgZmFpbHNcbiAgICB0aGlzLmNsb3NlKGVycm9yKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMub25lcnJvciAmJiB0aGlzLm9uZXJyb3IoZXJyb3IpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcihlcnJvcilcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgZm9yIGluY29taW5nIGRhdGEgZnJvbSB0aGUgc2VydmVyLiBUaGUgZGF0YSBpcyBzZW50IGluIGFyYml0cmFyeVxuICAgKiBjaHVua3MgYW5kIGNhbid0IGJlIHVzZWQgZGlyZWN0bHkgc28gdGhpcyBmdW5jdGlvbiBtYWtlcyBzdXJlIHRoZSBkYXRhXG4gICAqIGlzIHNwbGl0IGludG8gY29tcGxldGUgbGluZXMgYmVmb3JlIHRoZSBkYXRhIGlzIHBhc3NlZCB0byB0aGUgY29tbWFuZFxuICAgKiBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2dFxuICAgKi9cbiAgX29uRGF0YSAoZXZ0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcikgLy8gcmVzZXQgdGhlIHRpbWVvdXQgb24gZWFjaCBkYXRhIHBhY2tldFxuICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLnRpbWVvdXRTb2NrZXRMb3dlckJvdW5kICsgTWF0aC5mbG9vcig0MDk2ICogdGhpcy50aW1lb3V0U29ja2V0TXVsdGlwbGllcikgLy8gbWF4IHBhY2tldCBzaXplIGlzIDQwOTYgYnl0ZXNcbiAgICB0aGlzLl9zb2NrZXRUaW1lb3V0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCcgU29ja2V0IHRpbWVkIG91dCEnKSksIHRpbWVvdXQpXG5cbiAgICB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShldnQuZGF0YSkpIC8vIGFwcGVuZCB0byB0aGUgaW5jb21pbmcgYnVmZmVyXG4gICAgdGhpcy5fcGFyc2VJbmNvbWluZ0NvbW1hbmRzKHRoaXMuX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlcigpKSAvLyBDb25zdW1lIHRoZSBpbmNvbWluZyBidWZmZXJcbiAgfVxuXG4gICogX2l0ZXJhdGVJbmNvbWluZ0J1ZmZlciAoKSB7XG4gICAgbGV0IGJ1ZiA9IHRoaXMuX2luY29taW5nQnVmZmVyc1t0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoIC0gMV0gfHwgW11cbiAgICBsZXQgaSA9IDBcblxuICAgIC8vIGxvb3AgaW52YXJpYW50OlxuICAgIC8vICAgdGhpcy5faW5jb21pbmdCdWZmZXJzIHN0YXJ0cyB3aXRoIHRoZSBiZWdpbm5pbmcgb2YgaW5jb21pbmcgY29tbWFuZC5cbiAgICAvLyAgIGJ1ZiBpcyBzaG9ydGhhbmQgZm9yIGxhc3QgZWxlbWVudCBvZiB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMuXG4gICAgLy8gICBidWZbMC4uaS0xXSBpcyBwYXJ0IG9mIGluY29taW5nIGNvbW1hbmQuXG4gICAgd2hpbGUgKGkgPCBidWYubGVuZ3RoKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuX2J1ZmZlclN0YXRlKSB7XG4gICAgICAgIGNhc2UgQlVGRkVSX1NUQVRFX0xJVEVSQUw6XG4gICAgICAgICAgY29uc3QgZGlmZiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBpLCB0aGlzLl9saXRlcmFsUmVtYWluaW5nKVxuICAgICAgICAgIHRoaXMuX2xpdGVyYWxSZW1haW5pbmcgLT0gZGlmZlxuICAgICAgICAgIGkgKz0gZGlmZlxuICAgICAgICAgIGlmICh0aGlzLl9saXRlcmFsUmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgY2FzZSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMjpcbiAgICAgICAgICBpZiAoaSA8IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChidWZbaV0gPT09IENBUlJJQUdFX1JFVFVSTikge1xuICAgICAgICAgICAgICB0aGlzLl9saXRlcmFsUmVtYWluaW5nID0gTnVtYmVyKGZyb21UeXBlZEFycmF5KHRoaXMuX2xlbmd0aEJ1ZmZlcikpICsgMiAvLyBmb3IgQ1JMRlxuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9MSVRFUkFMXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9idWZmZXJTdGF0ZSA9IEJVRkZFUl9TVEFURV9ERUZBVUxUXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGVuZ3RoQnVmZmVyXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgY2FzZSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMTpcbiAgICAgICAgICBjb25zdCBzdGFydCA9IGlcbiAgICAgICAgICB3aGlsZSAoaSA8IGJ1Zi5sZW5ndGggJiYgYnVmW2ldID49IDQ4ICYmIGJ1ZltpXSA8PSA1NykgeyAvLyBkaWdpdHNcbiAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhcnQgIT09IGkpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdCA9IGJ1Zi5zdWJhcnJheShzdGFydCwgaSlcbiAgICAgICAgICAgIGNvbnN0IHByZXZCdWYgPSB0aGlzLl9sZW5ndGhCdWZmZXJcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHByZXZCdWYubGVuZ3RoICsgbGF0ZXN0Lmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlci5zZXQocHJldkJ1ZilcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aEJ1ZmZlci5zZXQobGF0ZXN0LCBwcmV2QnVmLmxlbmd0aClcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPCBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGVuZ3RoQnVmZmVyLmxlbmd0aCA+IDAgJiYgYnVmW2ldID09PSBSSUdIVF9DVVJMWV9CUkFDS0VUKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2J1ZmZlclN0YXRlID0gQlVGRkVSX1NUQVRFX1BPU1NJQkxZX0xJVEVSQUxfTEVOR1RIXzJcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9sZW5ndGhCdWZmZXJcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfREVGQVVMVFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBmaW5kIGxpdGVyYWwgbGVuZ3RoXG4gICAgICAgICAgY29uc3QgbGVmdElkeCA9IGJ1Zi5pbmRleE9mKExFRlRfQ1VSTFlfQlJBQ0tFVCwgaSlcbiAgICAgICAgICBpZiAobGVmdElkeCA+IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBsZWZ0T2ZMZWZ0Q3VybHkgPSBuZXcgVWludDhBcnJheShidWYuYnVmZmVyLCBpLCBsZWZ0SWR4IC0gaSlcbiAgICAgICAgICAgIGlmIChsZWZ0T2ZMZWZ0Q3VybHkuaW5kZXhPZihMSU5FX0ZFRUQpID09PSAtMSkge1xuICAgICAgICAgICAgICBpID0gbGVmdElkeCArIDFcbiAgICAgICAgICAgICAgdGhpcy5fbGVuZ3RoQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoMClcbiAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyU3RhdGUgPSBCVUZGRVJfU1RBVEVfUE9TU0lCTFlfTElURVJBTF9MRU5HVEhfMVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGZpbmQgZW5kIG9mIGNvbW1hbmRcbiAgICAgICAgICBjb25zdCBMRmlkeCA9IGJ1Zi5pbmRleE9mKExJTkVfRkVFRCwgaSlcbiAgICAgICAgICBpZiAoTEZpZHggPiAtMSkge1xuICAgICAgICAgICAgaWYgKExGaWR4IDwgYnVmLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzW3RoaXMuX2luY29taW5nQnVmZmVycy5sZW5ndGggLSAxXSA9IG5ldyBVaW50OEFycmF5KGJ1Zi5idWZmZXIsIDAsIExGaWR4ICsgMSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmRMZW5ndGggPSB0aGlzLl9pbmNvbWluZ0J1ZmZlcnMucmVkdWNlKChwcmV2LCBjdXJyKSA9PiBwcmV2ICsgY3Vyci5sZW5ndGgsIDApIC0gMiAvLyAyIGZvciBDUkxGXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gbmV3IFVpbnQ4QXJyYXkoY29tbWFuZExlbmd0aClcbiAgICAgICAgICAgIGxldCBpbmRleCA9IDBcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBsZXQgdWludDhBcnJheSA9IHRoaXMuX2luY29taW5nQnVmZmVycy5zaGlmdCgpXG5cbiAgICAgICAgICAgICAgY29uc3QgcmVtYWluaW5nTGVuZ3RoID0gY29tbWFuZExlbmd0aCAtIGluZGV4XG4gICAgICAgICAgICAgIGlmICh1aW50OEFycmF5Lmxlbmd0aCA+IHJlbWFpbmluZ0xlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2Vzc0xlbmd0aCA9IHVpbnQ4QXJyYXkubGVuZ3RoIC0gcmVtYWluaW5nTGVuZ3RoXG4gICAgICAgICAgICAgICAgdWludDhBcnJheSA9IHVpbnQ4QXJyYXkuc3ViYXJyYXkoMCwgLWV4Y2Vzc0xlbmd0aClcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmNvbWluZ0J1ZmZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzID0gW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29tbWFuZC5zZXQodWludDhBcnJheSwgaW5kZXgpXG4gICAgICAgICAgICAgIGluZGV4ICs9IHVpbnQ4QXJyYXkubGVuZ3RoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5aWVsZCBjb21tYW5kXG4gICAgICAgICAgICBpZiAoTEZpZHggPCBidWYubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICBidWYgPSBuZXcgVWludDhBcnJheShidWYuc3ViYXJyYXkoTEZpZHggKyAxKSlcbiAgICAgICAgICAgICAgdGhpcy5faW5jb21pbmdCdWZmZXJzLnB1c2goYnVmKVxuICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHRpbWVvdXQgd2hlbiBhbiBlbnRpcmUgY29tbWFuZCBoYXMgYXJyaXZlZFxuICAgICAgICAgICAgICAvLyBhbmQgbm90IHdhaXRpbmcgb24gbW9yZSBkYXRhIGZvciBuZXh0IGNvbW1hbmRcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NvY2tldFRpbWVvdXRUaW1lcilcbiAgICAgICAgICAgICAgdGhpcy5fc29ja2V0VGltZW91dFRpbWVyID0gbnVsbFxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFBSSVZBVEUgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYSBjb21tYW5kIGZyb20gdGhlIHF1ZXVlLiBUaGUgY29tbWFuZCBpcyBwYXJzZWQgYW5kIGZlZWRlZCB0byBhIGhhbmRsZXJcbiAgICovXG4gIF9wYXJzZUluY29taW5nQ29tbWFuZHMgKGNvbW1hbmRzKSB7XG4gICAgZm9yICh2YXIgY29tbWFuZCBvZiBjb21tYW5kcykge1xuICAgICAgdGhpcy5fY2xlYXJJZGxlKClcblxuICAgICAgLypcbiAgICAgICAqIFRoZSBcIitcIi10YWdnZWQgcmVzcG9uc2UgaXMgYSBzcGVjaWFsIGNhc2U6XG4gICAgICAgKiBFaXRoZXIgdGhlIHNlcnZlciBjYW4gYXNrcyBmb3IgdGhlIG5leHQgY2h1bmsgb2YgZGF0YSwgZS5nLiBmb3IgdGhlIEFVVEhFTlRJQ0FURSBjb21tYW5kLlxuICAgICAgICpcbiAgICAgICAqIE9yIHRoZXJlIHdhcyBhbiBlcnJvciBpbiB0aGUgWE9BVVRIMiBhdXRoZW50aWNhdGlvbiwgZm9yIHdoaWNoIFNBU0wgaW5pdGlhbCBjbGllbnQgcmVzcG9uc2UgZXh0ZW5zaW9uXG4gICAgICAgKiBkaWN0YXRlcyB0aGUgY2xpZW50IHNlbmRzIGFuIGVtcHR5IEVPTCByZXNwb25zZSB0byB0aGUgY2hhbGxlbmdlIGNvbnRhaW5pbmcgdGhlIGVycm9yIG1lc3NhZ2UuXG4gICAgICAgKlxuICAgICAgICogRGV0YWlscyBvbiBcIitcIi10YWdnZWQgcmVzcG9uc2U6XG4gICAgICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tMi4yLjFcbiAgICAgICAqL1xuICAgICAgLy9cbiAgICAgIGlmIChjb21tYW5kWzBdID09PSBBU0NJSV9QTFVTKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhLmxlbmd0aCkge1xuICAgICAgICAgIC8vIGZlZWQgdGhlIG5leHQgY2h1bmsgb2YgZGF0YVxuICAgICAgICAgIHZhciBjaHVuayA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLmRhdGEuc2hpZnQoKVxuICAgICAgICAgIGNodW5rICs9ICghdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5sZW5ndGggPyBFT0wgOiAnJykgLy8gRU9MIGlmIHRoZXJlJ3Mgbm90aGluZyBtb3JlIHRvIHNlbmRcbiAgICAgICAgICB0aGlzLnNlbmQoY2h1bmspXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fY3VycmVudENvbW1hbmQuZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUpIHtcbiAgICAgICAgICB0aGlzLnNlbmQoRU9MKSAvLyBYT0FVVEgyIGVtcHR5IHJlc3BvbnNlLCBlcnJvciB3aWxsIGJlIHJlcG9ydGVkIHdoZW4gc2VydmVyIGNvbnRpbnVlcyB3aXRoIE5PIHJlc3BvbnNlXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHJlc3BvbnNlXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2YWx1ZUFzU3RyaW5nID0gdGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdCAmJiB0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0LnZhbHVlQXNTdHJpbmdcbiAgICAgICAgcmVzcG9uc2UgPSBwYXJzZXIoY29tbWFuZCwgeyB2YWx1ZUFzU3RyaW5nIH0pXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTOicsICgpID0+IGNvbXBpbGVyKHJlc3BvbnNlLCBmYWxzZSwgdHJ1ZSkpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBwYXJzaW5nIGltYXAgY29tbWFuZCEnLCByZXNwb25zZSlcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uRXJyb3IoZSlcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKVxuICAgICAgdGhpcy5faGFuZGxlUmVzcG9uc2UocmVzcG9uc2UpXG5cbiAgICAgIC8vIGZpcnN0IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlciwgY29ubmVjdGlvbiBpcyBub3cgdXNhYmxlXG4gICAgICBpZiAoIXRoaXMuX2Nvbm5lY3Rpb25SZWFkeSkge1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uUmVhZHkgPSB0cnVlXG4gICAgICAgIHRoaXMub25yZWFkeSAmJiB0aGlzLm9ucmVhZHkoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGZWVkcyBhIHBhcnNlZCByZXNwb25zZSBvYmplY3QgdG8gYW4gYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIGNvbW1hbmQgb2JqZWN0XG4gICAqL1xuICBfaGFuZGxlUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgdmFyIGNvbW1hbmQgPSBwcm9wT3IoJycsICdjb21tYW5kJywgcmVzcG9uc2UpLnRvVXBwZXJDYXNlKCkudHJpbSgpXG5cbiAgICBpZiAoIXRoaXMuX2N1cnJlbnRDb21tYW5kKSB7XG4gICAgICAvLyB1bnNvbGljaXRlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgaWYgKHJlc3BvbnNlLnRhZyA9PT0gJyonICYmIGNvbW1hbmQgaW4gdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWQpIHtcbiAgICAgICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWRbY29tbWFuZF0ocmVzcG9uc2UpXG4gICAgICAgIHRoaXMuX2NhblNlbmQgPSB0cnVlXG4gICAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWQgJiYgcmVzcG9uc2UudGFnID09PSAnKicgJiYgY29tbWFuZCBpbiB0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkKSB7XG4gICAgICAvLyBleHBlY3RlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgdGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZFtjb21tYW5kXS5wdXNoKHJlc3BvbnNlKVxuICAgIH0gZWxzZSBpZiAocmVzcG9uc2UudGFnID09PSAnKicgJiYgY29tbWFuZCBpbiB0aGlzLl9nbG9iYWxBY2NlcHRVbnRhZ2dlZCkge1xuICAgICAgLy8gdW5leHBlY3RlZCB1bnRhZ2dlZCByZXNwb25zZVxuICAgICAgdGhpcy5fZ2xvYmFsQWNjZXB0VW50YWdnZWRbY29tbWFuZF0ocmVzcG9uc2UpXG4gICAgfSBlbHNlIGlmIChyZXNwb25zZS50YWcgPT09IHRoaXMuX2N1cnJlbnRDb21tYW5kLnRhZykge1xuICAgICAgLy8gdGFnZ2VkIHJlc3BvbnNlXG4gICAgICBpZiAodGhpcy5fY3VycmVudENvbW1hbmQucGF5bG9hZCAmJiBPYmplY3Qua2V5cyh0aGlzLl9jdXJyZW50Q29tbWFuZC5wYXlsb2FkKS5sZW5ndGgpIHtcbiAgICAgICAgcmVzcG9uc2UucGF5bG9hZCA9IHRoaXMuX2N1cnJlbnRDb21tYW5kLnBheWxvYWRcbiAgICAgIH1cbiAgICAgIHRoaXMuX2N1cnJlbnRDb21tYW5kLmNhbGxiYWNrKHJlc3BvbnNlKVxuICAgICAgdGhpcy5fY2FuU2VuZCA9IHRydWVcbiAgICAgIHRoaXMuX3NlbmRSZXF1ZXN0KClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYSBjb21tYW5kIGZyb20gY2xpZW50IHF1ZXVlIHRvIHRoZSBzZXJ2ZXIuXG4gICAqL1xuICBfc2VuZFJlcXVlc3QgKCkge1xuICAgIGlmICghdGhpcy5fY2xpZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZW50ZXJJZGxlKClcbiAgICB9XG4gICAgdGhpcy5fY2xlYXJJZGxlKClcblxuICAgIC8vIGFuIG9wZXJhdGlvbiB3YXMgbWFkZSBpbiB0aGUgcHJlY2hlY2ssIG5vIG5lZWQgdG8gcmVzdGFydCB0aGUgcXVldWUgbWFudWFsbHlcbiAgICB0aGlzLl9yZXN0YXJ0UXVldWUgPSBmYWxzZVxuXG4gICAgdmFyIGNvbW1hbmQgPSB0aGlzLl9jbGllbnRRdWV1ZVswXVxuICAgIGlmICh0eXBlb2YgY29tbWFuZC5wcmVjaGVjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gcmVtZW1iZXIgdGhlIGNvbnRleHRcbiAgICAgIHZhciBjb250ZXh0ID0gY29tbWFuZFxuICAgICAgdmFyIHByZWNoZWNrID0gY29udGV4dC5wcmVjaGVja1xuICAgICAgZGVsZXRlIGNvbnRleHQucHJlY2hlY2tcblxuICAgICAgLy8gd2UgbmVlZCB0byByZXN0YXJ0IHRoZSBxdWV1ZSBoYW5kbGluZyBpZiBubyBvcGVyYXRpb24gd2FzIG1hZGUgaW4gdGhlIHByZWNoZWNrXG4gICAgICB0aGlzLl9yZXN0YXJ0UXVldWUgPSB0cnVlXG5cbiAgICAgIC8vIGludm9rZSB0aGUgcHJlY2hlY2sgY29tbWFuZCBhbmQgcmVzdW1lIG5vcm1hbCBvcGVyYXRpb24gYWZ0ZXIgdGhlIHByb21pc2UgcmVzb2x2ZXNcbiAgICAgIHByZWNoZWNrKGNvbnRleHQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAvLyB3ZSdyZSBkb25lIHdpdGggdGhlIHByZWNoZWNrXG4gICAgICAgIGlmICh0aGlzLl9yZXN0YXJ0UXVldWUpIHtcbiAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHJlc3RhcnQgdGhlIHF1ZXVlIGhhbmRsaW5nXG4gICAgICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKVxuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIC8vIHByZWNoZWNrIGZhaWxlZCwgc28gd2UgcmVtb3ZlIHRoZSBpbml0aWFsIGNvbW1hbmRcbiAgICAgICAgLy8gZnJvbSB0aGUgcXVldWUsIGludm9rZSBpdHMgY2FsbGJhY2sgYW5kIHJlc3VtZSBub3JtYWwgb3BlcmF0aW9uXG4gICAgICAgIGxldCBjbWRcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9jbGllbnRRdWV1ZS5pbmRleE9mKGNvbnRleHQpXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgY21kID0gdGhpcy5fY2xpZW50UXVldWUuc3BsaWNlKGluZGV4LCAxKVswXVxuICAgICAgICB9XG4gICAgICAgIGlmIChjbWQgJiYgY21kLmNhbGxiYWNrKSB7XG4gICAgICAgICAgY21kLmNhbGxiYWNrKGVycilcbiAgICAgICAgICB0aGlzLl9jYW5TZW5kID0gdHJ1ZVxuICAgICAgICAgIHRoaXMuX3BhcnNlSW5jb21pbmdDb21tYW5kcyh0aGlzLl9pdGVyYXRlSW5jb21pbmdCdWZmZXIoKSkgLy8gQ29uc3VtZSB0aGUgcmVzdCBvZiB0aGUgaW5jb21pbmcgYnVmZmVyXG4gICAgICAgICAgdGhpcy5fc2VuZFJlcXVlc3QoKSAvLyBjb250aW51ZSBzZW5kaW5nXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLl9jYW5TZW5kID0gZmFsc2VcbiAgICB0aGlzLl9jdXJyZW50Q29tbWFuZCA9IHRoaXMuX2NsaWVudFF1ZXVlLnNoaWZ0KClcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9jdXJyZW50Q29tbWFuZC5kYXRhID0gY29tcGlsZXIodGhpcy5fY3VycmVudENvbW1hbmQucmVxdWVzdCwgdHJ1ZSlcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDOicsICgpID0+IGNvbXBpbGVyKHRoaXMuX2N1cnJlbnRDb21tYW5kLnJlcXVlc3QsIGZhbHNlLCB0cnVlKSkgLy8gZXhjbHVkZXMgcGFzc3dvcmRzIGV0Yy5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgY29tcGlsaW5nIGltYXAgY29tbWFuZCEnLCB0aGlzLl9jdXJyZW50Q29tbWFuZC5yZXF1ZXN0KVxuICAgICAgcmV0dXJuIHRoaXMuX29uRXJyb3IobmV3IEVycm9yKCdFcnJvciBjb21waWxpbmcgaW1hcCBjb21tYW5kIScpKVxuICAgIH1cblxuICAgIHZhciBkYXRhID0gdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5zaGlmdCgpXG5cbiAgICB0aGlzLnNlbmQoZGF0YSArICghdGhpcy5fY3VycmVudENvbW1hbmQuZGF0YS5sZW5ndGggPyBFT0wgOiAnJykpXG4gICAgcmV0dXJuIHRoaXMud2FpdERyYWluXG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgb25pZGxlLCBub3RpbmcgdG8gZG8gY3VycmVudGx5XG4gICAqL1xuICBfZW50ZXJJZGxlICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVyKVxuICAgIHRoaXMuX2lkbGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gKHRoaXMub25pZGxlICYmIHRoaXMub25pZGxlKCkpLCB0aGlzLnRpbWVvdXRFbnRlcklkbGUpXG4gIH1cblxuICAvKipcbiAgICogQ2FuY2VsIGlkbGUgdGltZXJcbiAgICovXG4gIF9jbGVhcklkbGUgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZXIpXG4gICAgdGhpcy5faWRsZVRpbWVyID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCBwcm9jZXNzZXMgYSByZXNwb25zZSBpbnRvIGFuIGVhc2llciB0byBoYW5kbGUgZm9ybWF0LlxuICAgKiBBZGQgdW50YWdnZWQgbnVtYmVyZWQgcmVzcG9uc2VzIChlLmcuIEZFVENIKSBpbnRvIGEgbmljZWx5IGZlYXNpYmxlIGZvcm1cbiAgICogQ2hlY2tzIGlmIGEgcmVzcG9uc2UgaW5jbHVkZXMgb3B0aW9uYWwgcmVzcG9uc2UgY29kZXNcbiAgICogYW5kIGNvcGllcyB0aGVzZSBpbnRvIHNlcGFyYXRlIHByb3BlcnRpZXMuIEZvciBleGFtcGxlIHRoZVxuICAgKiBmb2xsb3dpbmcgcmVzcG9uc2UgaW5jbHVkZXMgYSBjYXBhYmlsaXR5IGxpc3RpbmcgYW5kIGEgaHVtYW5cbiAgICogcmVhZGFibGUgbWVzc2FnZTpcbiAgICpcbiAgICogICAgICogT0sgW0NBUEFCSUxJVFkgSUQgTkFNRVNQQUNFXSBBbGwgcmVhZHlcbiAgICpcbiAgICogVGhpcyBtZXRob2QgYWRkcyBhICdjYXBhYmlsaXR5JyBwcm9wZXJ0eSB3aXRoIGFuIGFycmF5IHZhbHVlIFsnSUQnLCAnTkFNRVNQQUNFJ11cbiAgICogdG8gdGhlIHJlc3BvbnNlIG9iamVjdC4gQWRkaXRpb25hbGx5ICdBbGwgcmVhZHknIGlzIGFkZGVkIGFzICdodW1hblJlYWRhYmxlJyBwcm9wZXJ0eS5cbiAgICpcbiAgICogU2VlIHBvc3NpYmxlbSBJTUFQIFJlc3BvbnNlIENvZGVzIGF0IGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM1NTMwXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgcmVzcG9uc2Ugb2JqZWN0XG4gICAqL1xuICBfcHJvY2Vzc1Jlc3BvbnNlIChyZXNwb25zZSkge1xuICAgIGxldCBjb21tYW5kID0gcHJvcE9yKCcnLCAnY29tbWFuZCcsIHJlc3BvbnNlKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuXG4gICAgLy8gbm8gYXR0cmlidXRlc1xuICAgIGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLmF0dHJpYnV0ZXMgfHwgIXJlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyB1bnRhZ2dlZCByZXNwb25zZXMgdy8gc2VxdWVuY2UgbnVtYmVyc1xuICAgIGlmIChyZXNwb25zZS50YWcgPT09ICcqJyAmJiAvXlxcZCskLy50ZXN0KHJlc3BvbnNlLmNvbW1hbmQpICYmIHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0udHlwZSA9PT0gJ0FUT00nKSB7XG4gICAgICByZXNwb25zZS5uciA9IE51bWJlcihyZXNwb25zZS5jb21tYW5kKVxuICAgICAgcmVzcG9uc2UuY29tbWFuZCA9IChyZXNwb25zZS5hdHRyaWJ1dGVzLnNoaWZ0KCkudmFsdWUgfHwgJycpLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKS50cmltKClcbiAgICB9XG5cbiAgICAvLyBubyBvcHRpb25hbCByZXNwb25zZSBjb2RlXG4gICAgaWYgKFsnT0snLCAnTk8nLCAnQkFEJywgJ0JZRScsICdQUkVBVVRIJ10uaW5kZXhPZihjb21tYW5kKSA8IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIElmIGxhc3QgZWxlbWVudCBvZiB0aGUgcmVzcG9uc2UgaXMgVEVYVCB0aGVuIHRoaXMgaXMgZm9yIGh1bWFuc1xuICAgIGlmIChyZXNwb25zZS5hdHRyaWJ1dGVzW3Jlc3BvbnNlLmF0dHJpYnV0ZXMubGVuZ3RoIC0gMV0udHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICByZXNwb25zZS5odW1hblJlYWRhYmxlID0gcmVzcG9uc2UuYXR0cmlidXRlc1tyZXNwb25zZS5hdHRyaWJ1dGVzLmxlbmd0aCAtIDFdLnZhbHVlXG4gICAgfVxuXG4gICAgLy8gUGFyc2UgYW5kIGZvcm1hdCBBVE9NIHZhbHVlc1xuICAgIGlmIChyZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnR5cGUgPT09ICdBVE9NJyAmJiByZXNwb25zZS5hdHRyaWJ1dGVzWzBdLnNlY3Rpb24pIHtcbiAgICAgIGNvbnN0IG9wdGlvbiA9IHJlc3BvbnNlLmF0dHJpYnV0ZXNbMF0uc2VjdGlvbi5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHtcbiAgICAgICAgICByZXR1cm4ga2V5Lm1hcCgoa2V5KSA9PiAoa2V5LnZhbHVlIHx8ICcnKS50b1N0cmluZygpLnRyaW0oKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gKGtleS52YWx1ZSB8fCAnJykudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBjb25zdCBrZXkgPSBvcHRpb24uc2hpZnQoKVxuICAgICAgcmVzcG9uc2UuY29kZSA9IGtleVxuXG4gICAgICBpZiAob3B0aW9uLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXNwb25zZVtrZXkudG9Mb3dlckNhc2UoKV0gPSBvcHRpb25bMF1cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9uLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmVzcG9uc2Vba2V5LnRvTG93ZXJDYXNlKCldID0gb3B0aW9uXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGFuIEVycm9yIG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBWYWx1ZSB0byBiZSBjaGVja2VkXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IHJldHVybnMgdHJ1ZSBpZiB0aGUgdmFsdWUgaXMgYW4gRXJyb3JcbiAgICovXG4gIGlzRXJyb3IgKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKS5tYXRjaCgvRXJyb3JcXF0kLylcbiAgfVxuXG4gIC8vIENPTVBSRVNTSU9OIFJFTEFURUQgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGRlZmxhdGUvaW5mbGF0ZSBmb3IgdGhlIElPXG4gICAqL1xuICBlbmFibGVDb21wcmVzc2lvbiAoKSB7XG4gICAgdGhpcy5fc29ja2V0T25EYXRhID0gdGhpcy5zb2NrZXQub25kYXRhXG4gICAgdGhpcy5jb21wcmVzc2VkID0gdHJ1ZVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5Xb3JrZXIpIHtcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyID0gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtDb21wcmVzc2lvbkJsb2JdKSkpXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5vbm1lc3NhZ2UgPSAoZSkgPT4ge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IGUuZGF0YS5tZXNzYWdlXG4gICAgICAgIHZhciBkYXRhID0gZS5kYXRhLmJ1ZmZlclxuXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9JTkZMQVRFRF9EQVRBX1JFQURZOlxuICAgICAgICAgICAgdGhpcy5fc29ja2V0T25EYXRhKHsgZGF0YSB9KVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9ERUZMQVRFRF9EQVRBX1JFQURZOlxuICAgICAgICAgICAgdGhpcy53YWl0RHJhaW4gPSB0aGlzLnNvY2tldC5zZW5kKGRhdGEpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLm9uZXJyb3IgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLl9vbkVycm9yKG5ldyBFcnJvcignRXJyb3IgaGFuZGxpbmcgY29tcHJlc3Npb24gd2ViIHdvcmtlcjogJyArIGUubWVzc2FnZSkpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoTUVTU0FHRV9JTklUSUFMSVpFX1dPUktFUikpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZmxhdGVkUmVhZHkgPSAoYnVmZmVyKSA9PiB7IHRoaXMuX3NvY2tldE9uRGF0YSh7IGRhdGE6IGJ1ZmZlciB9KSB9XG4gICAgICBjb25zdCBkZWZsYXRlZFJlYWR5ID0gKGJ1ZmZlcikgPT4geyB0aGlzLndhaXREcmFpbiA9IHRoaXMuc29ja2V0LnNlbmQoYnVmZmVyKSB9XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbiA9IG5ldyBDb21wcmVzc2lvbihpbmZsYXRlZFJlYWR5LCBkZWZsYXRlZFJlYWR5KVxuICAgIH1cblxuICAgIC8vIG92ZXJyaWRlIGRhdGEgaGFuZGxlciwgZGVjb21wcmVzcyBpbmNvbWluZyBkYXRhXG4gICAgdGhpcy5zb2NrZXQub25kYXRhID0gKGV2dCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNvbXByZXNzZWQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jb21wcmVzc2lvbldvcmtlcikge1xuICAgICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKE1FU1NBR0VfSU5GTEFURSwgZXZ0LmRhdGEpLCBbZXZ0LmRhdGFdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY29tcHJlc3Npb24uaW5mbGF0ZShldnQuZGF0YSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5kb2VzIGFueSBjaGFuZ2VzIHJlbGF0ZWQgdG8gY29tcHJlc3Npb24uIFRoaXMgb25seSBiZSBjYWxsZWQgd2hlbiBjbG9zaW5nIHRoZSBjb25uZWN0aW9uXG4gICAqL1xuICBfZGlzYWJsZUNvbXByZXNzaW9uICgpIHtcbiAgICBpZiAoIXRoaXMuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5jb21wcmVzc2VkID0gZmFsc2VcbiAgICB0aGlzLnNvY2tldC5vbmRhdGEgPSB0aGlzLl9zb2NrZXRPbkRhdGFcbiAgICB0aGlzLl9zb2NrZXRPbkRhdGEgPSBudWxsXG5cbiAgICBpZiAodGhpcy5fY29tcHJlc3Npb25Xb3JrZXIpIHtcbiAgICAgIC8vIHRlcm1pbmF0ZSB0aGUgd29ya2VyXG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci50ZXJtaW5hdGUoKVxuICAgICAgdGhpcy5fY29tcHJlc3Npb25Xb3JrZXIgPSBudWxsXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE91dGdvaW5nIHBheWxvYWQgbmVlZHMgdG8gYmUgY29tcHJlc3NlZCBhbmQgc2VudCB0byBzb2NrZXRcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyIE91dGdvaW5nIHVuY29tcHJlc3NlZCBhcnJheWJ1ZmZlclxuICAgKi9cbiAgX3NlbmRDb21wcmVzc2VkIChidWZmZXIpIHtcbiAgICAvLyBkZWZsYXRlXG4gICAgaWYgKHRoaXMuX2NvbXByZXNzaW9uV29ya2VyKSB7XG4gICAgICB0aGlzLl9jb21wcmVzc2lvbldvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKE1FU1NBR0VfREVGTEFURSwgYnVmZmVyKSwgW2J1ZmZlcl0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NvbXByZXNzaW9uLmRlZmxhdGUoYnVmZmVyKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBjcmVhdGVNZXNzYWdlID0gKG1lc3NhZ2UsIGJ1ZmZlcikgPT4gKHsgbWVzc2FnZSwgYnVmZmVyIH0pXG4iXX0=
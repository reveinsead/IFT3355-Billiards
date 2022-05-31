/*
Uniforms already defined by THREE.js
------------------------------------------------------
uniform mat4 viewMatrix; = camera.matrixWorldInverse
uniform vec3 cameraPosition; = camera position in world space
------------------------------------------------------
*/

uniform sampler2D textureMask;//Texture mask, color is different depending on whether this mask is white or black.
uniform sampler2D textureNumberMask;//Texture containing the billard ball's number, the final color should be black when this mask is black.
uniform vec3 maskLightColor;//Ambient/Diffuse/Specular Color when textureMask is white
uniform vec3 materialDiffuseColor;//Diffuse color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform vec3 materialSpecularColor;//Specular color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform vec3 materialAmbientColor;//Ambient color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform float shininess;//Shininess factor

uniform vec3 lightDirection;//Direction of directional light in world space
uniform vec3 lightColor;//Color of directional light
uniform vec3 ambientLightColor;//Color of ambient light

in vec3 diffColor;
in vec3 specularColor;
in vec3 normalInterp;
in vec3 relativeVertexPosition3;
in vec2 texCoord;

vec3 color;

void main() {
    //TODO: GOURAUD SHADING
    //Use Phong reflection model
    //Hint: Compute shading in vertex shader, then pass it to the fragment shader for interpolation

    //Before applying textures, assume that materialDiffuseColor/materialSpecularColor/materialAmbientColor are the default diffuse/specular/ambient color.
    //For textures, you can first use texture2D(textureMask, uv) as the billard balls' color to verify correctness, then use mix(...) to re-introduce color.
    //Finally, mix textureNumberMask too so numbers appear on the billard balls and are black.

    //test if the billard is white or black
    vec4 billardTexture=texture2D(textureMask, texCoord);
    vec4 numberTexture=texture2D(textureNumberMask, texCoord);

    color=mix(materialAmbientColor,maskLightColor,billardTexture.rgb)*ambientLightColor+
    mix(materialDiffuseColor,maskLightColor,billardTexture.rgb)*diffColor+
    mix(materialSpecularColor,maskLightColor,billardTexture.rgb)*specularColor;

    //Placeholder color
    color=color*numberTexture.rgb;
    gl_FragColor = vec4(color, 1.0);

}
/*
Uniforms already defined by THREE.js
------------------------------------------------------
uniform mat4 viewMatrix; = camera.matrixWorldInverse
uniform vec3 cameraPosition; = camera position in world space
------------------------------------------------------
*/

uniform sampler2D textureMask; //Texture mask, color is different depending on whether this mask is white or black.
uniform sampler2D textureNumberMask; //Texture containing the billard ball's number, the final color should be black when this mask is black.
uniform vec3 maskLightColor; //Ambient/Diffuse/Specular Color when textureMask is white
uniform vec3 materialDiffuseColor; //Diffuse color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform vec3 materialSpecularColor; //Specular color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform vec3 materialAmbientColor; //Ambient color when textureMask is black (You can assume this is the default color when you are not using textures)
uniform float shininess; //Shininess factor

uniform vec3 lightDirection; //Direction of directional light in world space
uniform vec3 lightColor; //Color of directional light
uniform vec3 ambientLightColor; //Color of ambient light

varying vec3 normalInterp;
varying vec3 relativeVertexPosition3;
varying vec2 texCoord;
vec3 color;
float nlAngle;
float specular;

void main() {
	//TODO: BLINN-PHONG SHADING
	//Use Blinn-Phong reflection model
	//Hint: Similar to Phong shader, but use halfway vector instead.
	
	//Before applying textures, assume that materialDiffuseColor/materialSpecularColor/materialAmbientColor are the default diffuse/specular/ambient color.
	//For textures, you can first use texture2D(textureMask, uv) as the billard balls' color to verify correctness, then use mix(...) to re-introduce color.
	//Finally, mix textureNumberMask too so numbers appear on the billard balls and are black.

	vec3 n=normalize(normalInterp);
	vec3 l=normalize(-lightDirection);

	nlAngle= max(dot(n, l), 0.0);// Lambert's cosine law
	specular=0.0;
	if (nlAngle > 0.0) {
		vec3 v = normalize(-relativeVertexPosition3);// Vector to viewer
		vec3 halfDir=normalize((l+v)*0.5);
		// Compute the specular term
		float specAngle = max(dot(halfDir, n), 0.0);
		specular = pow(specAngle, shininess);
	}
	//test if the billard is white or black
	vec4 billardTexture=texture2D(textureMask, texCoord);
	vec4 numberTexture=texture2D(textureNumberMask, texCoord);

	color=mix(materialAmbientColor,maskLightColor,billardTexture.rgb)*ambientLightColor+
	mix(materialDiffuseColor,maskLightColor,billardTexture.rgb)*lightColor * nlAngle+
	mix(materialSpecularColor,maskLightColor,billardTexture.rgb)*lightColor * specular;

	//Placeholder color
	color=color*numberTexture.rgb;
	gl_FragColor = vec4(color, 1.0);
}